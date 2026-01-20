import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Camera, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { armoiresService } from '@/services/armoires.service';
import { verificationService, verificationSystemeService, verificationPhotoService } from '@/services/verification.service';
import { uploadPhotoToStorage } from '@/utils/storage';
import CameraCapture from '@/components/CameraCapture';
import NumberSelector from '@/components/NumberSelector';
import ZoneSelector from '@/components/ZoneSelector';
import type { ModeleSysteme, TypeContact, TemperatureSprinkler, EtatTube } from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

const TEMPERATURES: TemperatureSprinkler[] = ['57', '68', '79'];

interface SystemeFormData {
  modele: ModeleSysteme;
  quantite: number;
  tube: boolean;
  pressostat: boolean;
  pressostat_type: TypeContact;
  pressostat_quantite: number;
  tete_sprinkler: boolean;
  tete_sprinkler_quantite: number;
  tete_sprinkler_temperature: TemperatureSprinkler;
  sirene_flash: boolean;
  sirene_flash_quantite: number;
  panneau: boolean;
  contact_nf_suppl: boolean;
  pression_ok: boolean;
  etat_tube: EtatTube;
  tete_sprinkler_ok: boolean;
  sirene_flash_ok: boolean;
  batterie_changee: boolean;
  etat_environnement: string[];
  etat_environnement_autre: string;
}

interface ArmoireFormData {
  tempId: string;
  nom_armoire: string;
  zone: string;
  systemes: SystemeFormData[];
  photos: string[];
  commentaire: string;
  expanded: boolean;
}

export default function VerificationSessionPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [dateVerification, setDateVerification] = useState(new Date().toISOString().split('T')[0]);
  const [armoires, setArmoires] = useState<ArmoireFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [currentArmoireIndex, setCurrentArmoireIndex] = useState<number | null>(null);
  const [lastAddedArmoireId, setLastAddedArmoireId] = useState<string | null>(null);
  const armoireRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const selectedClientData = clients?.find((c) => c.id === selectedClient);
  const sites = selectedClientData?.sites || [];
  const isMultiSite = selectedClientData?.multi_site ?? false;
  const effectiveSiteId = isMultiSite ? selectedSite : (sites[0]?.id || '');

  const handleAddArmoire = () => {
    const newId = `temp-${Date.now()}`;
    setArmoires([
      ...armoires,
      {
        tempId: newId,
        nom_armoire: '',
        zone: '',
        systemes: [],
        photos: [],
        commentaire: '',
        expanded: true,
      },
    ]);
    setLastAddedArmoireId(newId);
  };

  useEffect(() => {
    if (lastAddedArmoireId && armoireRefs.current[lastAddedArmoireId]) {
      const input = armoireRefs.current[lastAddedArmoireId];
      setTimeout(() => {
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input?.focus();
      }, 100);
      setLastAddedArmoireId(null);
    }
  }, [lastAddedArmoireId, armoires]);

  const handleRemoveArmoire = (tempId: string) => {
    setArmoires(armoires.filter((a) => a.tempId !== tempId));
  };

  const handleArmoireChange = (tempId: string, field: keyof ArmoireFormData, value: any) => {
    setArmoires(armoires.map((a) => (a.tempId === tempId ? { ...a, [field]: value } : a)));
  };

  const handleAddSysteme = (armoireTempId: string) => {
    const armoire = armoires.find((a) => a.tempId === armoireTempId);
    if (!armoire) return;

    const newSysteme: SystemeFormData = {
      modele: 'RV1m3',
      quantite: 1,
      tube: true,
      pressostat: true,
      pressostat_type: 'NO/NF',
      pressostat_quantite: 1,
      tete_sprinkler: true,
      tete_sprinkler_quantite: 1,
      tete_sprinkler_temperature: '68',
      sirene_flash: false,
      sirene_flash_quantite: 1,
      panneau: false,
      contact_nf_suppl: false,
      pression_ok: true,
      etat_tube: 'Bon',
      tete_sprinkler_ok: true,
      sirene_flash_ok: true,
      batterie_changee: true,
      etat_environnement: [],
      etat_environnement_autre: '',
    };

    handleArmoireChange(armoireTempId, 'systemes', [...armoire.systemes, newSysteme]);
  };

  const handleRemoveSysteme = (armoireTempId: string, systemeIndex: number) => {
    const armoire = armoires.find((a) => a.tempId === armoireTempId);
    if (!armoire) return;

    const newSystemes = armoire.systemes.filter((_, idx) => idx !== systemeIndex);
    handleArmoireChange(armoireTempId, 'systemes', newSystemes);
  };

  const handleSystemeChange = (armoireTempId: string, systemeIndex: number, field: keyof SystemeFormData, value: any) => {
    const armoire = armoires.find((a) => a.tempId === armoireTempId);
    if (!armoire) return;

    const newSystemes = armoire.systemes.map((s, idx) =>
      idx === systemeIndex ? { ...s, [field]: value } : s
    );
    handleArmoireChange(armoireTempId, 'systemes', newSystemes);
  };

  const handlePhotoCapture = async (photoDataUrl: string) => {
    if (currentArmoireIndex === null) return;

    try {
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const photoUrl = await uploadPhotoToStorage(file, 'verification-photos');

      if (!photoUrl) {
        alert('Erreur lors de la sauvegarde de la photo');
        return;
      }

      const armoire = armoires[currentArmoireIndex];
      handleArmoireChange(armoire.tempId, 'photos', [...armoire.photos, photoUrl]);
      setCapturingPhoto(false);
      setCurrentArmoireIndex(null);
    } catch (error) {
      console.error('Erreur lors de la capture photo:', error);
      alert('Erreur lors de la sauvegarde de la photo');
    }
  };

  const handleFileUpload = async (armoireTempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const photoUrl = await uploadPhotoToStorage(file, 'verification-photos');
        return photoUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      const armoire = armoires.find((a) => a.tempId === armoireTempId);
      if (armoire) {
        handleArmoireChange(armoireTempId, 'photos', [...armoire.photos, ...validUrls]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload des photos:', error);
      alert('Erreur lors de l\'upload des photos');
    }
  };

  const handleRemovePhoto = (armoireTempId: string, photoIndex: number) => {
    const armoire = armoires.find((a) => a.tempId === armoireTempId);
    if (!armoire) return;

    const newPhotos = armoire.photos.filter((_, idx) => idx !== photoIndex);
    handleArmoireChange(armoireTempId, 'photos', newPhotos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveSiteId) {
      alert('Veuillez sélectionner un client et un site');
      return;
    }

    if (armoires.length === 0) {
      alert('Veuillez ajouter au moins une armoire');
      return;
    }

    for (const armoire of armoires) {
      if (!armoire.nom_armoire.trim()) {
        alert('Veuillez renseigner le nom de toutes les armoires');
        return;
      }
      if (armoire.systemes.length === 0) {
        alert(`L'armoire "${armoire.nom_armoire}" doit avoir au moins un système`);
        return;
      }
    }

    setSaving(true);
    try {
      const sessionId = crypto.randomUUID();

      for (const armoire of armoires) {
        let armoireRecord = await armoiresService.getBySiteAndName(effectiveSiteId, armoire.nom_armoire);

        if (!armoireRecord) {
          armoireRecord = await armoiresService.create({
            site_id: effectiveSiteId,
            nom_armoire: armoire.nom_armoire,
            zone: armoire.zone || undefined,
            ventilation: false,
          });
        }

        const verification = await verificationService.create({
          armoire_id: armoireRecord.id,
          date_verification: dateVerification,
          statut: 'fait',
          commentaire: armoire.commentaire || undefined,
          session_id: sessionId,
        });

        for (const systeme of armoire.systemes) {
          await verificationSystemeService.create({
            verification_id: verification.id,
            modele: systeme.modele,
            quantite: systeme.quantite,
            tube: systeme.tube,
            pressostat: systeme.pressostat,
            pressostat_type: systeme.pressostat_type,
            pressostat_quantite: systeme.pressostat ? systeme.pressostat_quantite : undefined,
            tete_sprinkler: systeme.tete_sprinkler,
            tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
            tete_sprinkler_temperature: systeme.tete_sprinkler_temperature,
            sirene_flash: systeme.sirene_flash,
            sirene_flash_quantite: systeme.sirene_flash ? systeme.sirene_flash_quantite : undefined,
            panneau: systeme.panneau,
            contact_nf_suppl: systeme.contact_nf_suppl,
            pression_ok: systeme.pression_ok,
            etat_tube: systeme.etat_tube,
            tete_sprinkler_ok: systeme.tete_sprinkler_ok,
            sirene_flash_ok: systeme.sirene_flash_ok,
            batterie_changee: systeme.batterie_changee,
            etat_environnement: systeme.etat_environnement.length > 0 ? systeme.etat_environnement : undefined,
            etat_environnement_autre: systeme.etat_environnement_autre || undefined,
          });
        }

        for (let i = 0; i < armoire.photos.length; i++) {
          await verificationPhotoService.create({
            verification_id: verification.id,
            url_photo: armoire.photos[i],
            position: i + 1,
          });
        }
      }

      navigate(`/verification/signature/${sessionId}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la vérification');
      setSaving(false);
    }
  };

  if (capturingPhoto && currentArmoireIndex !== null) {
    return (
      <CameraCapture
        onCapture={handlePhotoCapture}
        onCancel={() => {
          setCapturingPhoto(false);
          setCurrentArmoireIndex(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle Vérification</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Sélection Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Client *</label>
              <select
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  setSelectedSite('');
                }}
                className="input"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>

            {isMultiSite && (
              <div>
                <label className="label">Site *</label>
                <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="input" required>
                  <option value="">Sélectionner un site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Date de vérification *</label>
              <input
                type="date"
                value={dateVerification}
                onChange={(e) => setDateVerification(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {armoires.map((armoire, armoireIndex) => (
          <div key={armoire.tempId} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleArmoireChange(armoire.tempId, 'expanded', !armoire.expanded)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {armoire.expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <h3 className="text-lg font-semibold">
                  Armoire {armoireIndex + 1} {armoire.nom_armoire && `- ${armoire.nom_armoire}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveArmoire(armoire.tempId)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {armoire.expanded && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nom de l'armoire *</label>
                    <input
                      ref={(el) => (armoireRefs.current[armoire.tempId] = el)}
                      type="text"
                      value={armoire.nom_armoire}
                      onChange={(e) => handleArmoireChange(armoire.tempId, 'nom_armoire', e.target.value)}
                      className="input"
                      placeholder="ex: A1, B2, Local Technique..."
                      required
                    />
                  </div>
                  <div>
                    <ZoneSelector
                      value={armoire.zone}
                      onChange={(value) => handleArmoireChange(armoire.tempId, 'zone', value)}
                      label="Zone"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Systèmes ({armoire.systemes.length})</h4>
                    <button
                      type="button"
                      onClick={() => handleAddSysteme(armoire.tempId)}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter système</span>
                    </button>
                  </div>

                  {armoire.systemes.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Aucun système ajouté</p>
                  )}

                  {armoire.systemes.map((systeme, systemeIndex) => (
                    <div key={systemeIndex} className="border rounded-lg p-4 space-y-3 mb-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Système {systemeIndex + 1}</h5>
                        <button
                          type="button"
                          onClick={() => handleRemoveSysteme(armoire.tempId, systemeIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label">Modèle (m³)</label>
                          <div className="flex flex-wrap gap-2">
                            {MODELES.map((m) => (
                              <button
                                key={m.value}
                                type="button"
                                onClick={() => handleSystemeChange(armoire.tempId, systemeIndex, 'modele', m.value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                  systeme.modele === m.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <NumberSelector
                            value={systeme.quantite}
                            onChange={(value) => handleSystemeChange(armoire.tempId, systemeIndex, 'quantite', value)}
                            label="Quantité"
                            min={1}
                            max={8}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-3">
                        <h6 className="text-sm font-medium text-gray-700">Produits supplémentaires</h6>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`tube-${armoire.tempId}-${systemeIndex}`}
                            checked={systeme.tube}
                            onChange={(e) => handleSystemeChange(armoire.tempId, systemeIndex, 'tube', e.target.checked)}
                            className="mr-2 h-4 w-4 text-primary-600 rounded"
                          />
                          <label htmlFor={`tube-${armoire.tempId}-${systemeIndex}`} className="text-sm font-medium">Tube</label>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`pressostat-${armoire.tempId}-${systemeIndex}`}
                              checked={systeme.pressostat}
                              onChange={(e) => handleSystemeChange(armoire.tempId, systemeIndex, 'pressostat', e.target.checked)}
                              className="mr-2 h-4 w-4 text-primary-600 rounded"
                            />
                            <label htmlFor={`pressostat-${armoire.tempId}-${systemeIndex}`} className="text-sm font-medium">Pressostat NO/NF</label>
                          </div>
                          {systeme.pressostat && (
                            <div className="ml-6 space-y-2">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSystemeChange(armoire.tempId, systemeIndex, 'pressostat_type', 'NO')}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    systeme.pressostat_type === 'NO'
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                  }`}
                                >
                                  NO
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSystemeChange(armoire.tempId, systemeIndex, 'pressostat_type', 'NO/NF')}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    systeme.pressostat_type === 'NO/NF'
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                  }`}
                                >
                                  NO/NF
                                </button>
                              </div>
                              <NumberSelector
                                value={systeme.pressostat_quantite}
                                onChange={(value) => handleSystemeChange(armoire.tempId, systemeIndex, 'pressostat_quantite', value)}
                                label="Quantité"
                                min={1}
                                max={8}
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`tete-${armoire.tempId}-${systemeIndex}`}
                              checked={systeme.tete_sprinkler}
                              onChange={(e) => handleSystemeChange(armoire.tempId, systemeIndex, 'tete_sprinkler', e.target.checked)}
                              className="mr-2 h-4 w-4 text-primary-600 rounded"
                            />
                            <label htmlFor={`tete-${armoire.tempId}-${systemeIndex}`} className="text-sm font-medium">Tête sprinkler</label>
                          </div>
                          {systeme.tete_sprinkler && (
                            <div className="ml-6 space-y-2">
                              <div>
                                <NumberSelector
                                  value={systeme.tete_sprinkler_quantite}
                                  onChange={(value) => handleSystemeChange(armoire.tempId, systemeIndex, 'tete_sprinkler_quantite', value)}
                                  label="Quantité"
                                  min={1}
                                  max={8}
                                />
                              </div>
                              <div>
                                <label className="label text-sm">Température (°C)</label>
                                <div className="flex flex-wrap gap-2">
                                  {TEMPERATURES.map((t) => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => handleSystemeChange(armoire.tempId, systemeIndex, 'tete_sprinkler_temperature', t)}
                                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                                        systeme.tete_sprinkler_temperature === t
                                          ? t === '68'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-primary-600 text-white'
                                          : t === '68'
                                            ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                      }`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`sirene-${armoire.tempId}-${systemeIndex}`}
                              checked={systeme.sirene_flash}
                              onChange={(e) => handleSystemeChange(armoire.tempId, systemeIndex, 'sirene_flash', e.target.checked)}
                              className="mr-2 h-4 w-4 text-primary-600 rounded"
                            />
                            <label htmlFor={`sirene-${armoire.tempId}-${systemeIndex}`} className="text-sm font-medium">Sirène flash</label>
                          </div>
                          {systeme.sirene_flash && (
                            <div className="ml-6">
                              <NumberSelector
                                value={systeme.sirene_flash_quantite}
                                onChange={(value) => handleSystemeChange(armoire.tempId, systemeIndex, 'sirene_flash_quantite', value)}
                                label="Quantité"
                                min={1}
                                max={8}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`panneau-${armoire.tempId}-${systemeIndex}`}
                            checked={systeme.panneau}
                            onChange={(e) => handleSystemeChange(armoire.tempId, systemeIndex, 'panneau', e.target.checked)}
                            className="mr-2 h-4 w-4 text-primary-600 rounded"
                          />
                          <label htmlFor={`panneau-${armoire.tempId}-${systemeIndex}`} className="text-sm font-medium">Panneau</label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`contact-${armoire.tempId}-${systemeIndex}`}
                            checked={systeme.contact_nf_suppl}
                            onChange={(e) => handleSystemeChange(armoire.tempId, systemeIndex, 'contact_nf_suppl', e.target.checked)}
                            className="mr-2 h-4 w-4 text-primary-600 rounded"
                          />
                          <label htmlFor={`contact-${armoire.tempId}-${systemeIndex}`} className="text-sm font-medium">Contact NF Suppl.</label>
                        </div>
                      </div>

                      <div className="border-t pt-3 mt-3">
                        <h6 className="font-medium text-sm mb-3">Contrôles de Vérification</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-sm">Pression OK</label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.pression_ok === true}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'pression_ok', true)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Oui</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.pression_ok === false}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'pression_ok', false)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Non</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="label text-sm">État du tube</label>
                            <select
                              value={systeme.etat_tube}
                              onChange={(e) =>
                                handleSystemeChange(armoire.tempId, systemeIndex, 'etat_tube', e.target.value as EtatTube)
                              }
                              className="input text-sm"
                            >
                              <option value="Bon">Bon</option>
                              <option value="Pincé">Pincé</option>
                              <option value="Défectueux">Défectueux</option>
                            </select>
                          </div>

                          <div>
                            <label className="label text-sm">Tête sprinkler OK</label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.tete_sprinkler_ok === true}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'tete_sprinkler_ok', true)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Oui</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.tete_sprinkler_ok === false}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'tete_sprinkler_ok', false)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Non</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="label text-sm">Sirène flash OK</label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.sirene_flash_ok === true}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'sirene_flash_ok', true)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Oui</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.sirene_flash_ok === false}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'sirene_flash_ok', false)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Non</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="label text-sm">Batterie sirène flash changée</label>
                            <div className="flex gap-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.batterie_changee === true}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'batterie_changee', true)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Oui</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  checked={systeme.batterie_changee === false}
                                  onChange={() => handleSystemeChange(armoire.tempId, systemeIndex, 'batterie_changee', false)}
                                  className="mr-2"
                                />
                                <span className="text-sm">Non</span>
                              </label>
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="label text-sm">État général de l'environnement du système</label>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-3">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={systeme.etat_environnement.includes('Poussière')}
                                    onChange={(e) => {
                                      const newEnv = e.target.checked
                                        ? [...systeme.etat_environnement, 'Poussière']
                                        : systeme.etat_environnement.filter((v) => v !== 'Poussière');
                                      handleSystemeChange(armoire.tempId, systemeIndex, 'etat_environnement', newEnv);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">Poussière</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={systeme.etat_environnement.includes('Corrosion')}
                                    onChange={(e) => {
                                      const newEnv = e.target.checked
                                        ? [...systeme.etat_environnement, 'Corrosion']
                                        : systeme.etat_environnement.filter((v) => v !== 'Corrosion');
                                      handleSystemeChange(armoire.tempId, systemeIndex, 'etat_environnement', newEnv);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">Corrosion</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={systeme.etat_environnement.includes('Autre')}
                                    onChange={(e) => {
                                      const newEnv = e.target.checked
                                        ? [...systeme.etat_environnement, 'Autre']
                                        : systeme.etat_environnement.filter((v) => v !== 'Autre');
                                      handleSystemeChange(armoire.tempId, systemeIndex, 'etat_environnement', newEnv);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">Autre</span>
                                </label>
                              </div>
                              {systeme.etat_environnement.includes('Autre') && (
                                <input
                                  type="text"
                                  value={systeme.etat_environnement_autre}
                                  onChange={(e) =>
                                    handleSystemeChange(armoire.tempId, systemeIndex, 'etat_environnement_autre', e.target.value)
                                  }
                                  className="input text-sm"
                                  placeholder="Préciser..."
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Photos ({armoire.photos.length})</h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {armoire.photos.map((photo, photoIndex) => (
                      <div key={photoIndex} className="relative">
                        <img
                          src={photo}
                          alt={`Photo ${photoIndex + 1}`}
                          crossOrigin="anonymous"
                          className="w-full h-32 object-cover rounded border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(armoire.tempId, photoIndex)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentArmoireIndex(armoireIndex);
                        setCapturingPhoto(true);
                      }}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Prendre une photo</span>
                    </button>
                    <label className="btn-secondary text-sm flex items-center space-x-1 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Ajouter des fichiers</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(armoire.tempId, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Commentaire</label>
                  <textarea
                    value={armoire.commentaire}
                    onChange={(e) => handleArmoireChange(armoire.tempId, 'commentaire', e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Observations, remarques..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleAddArmoire}
            className="btn-secondary flex items-center space-x-2"
            disabled={!effectiveSiteId}
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter une armoire</span>
          </button>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/verification')} className="btn-secondary">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !effectiveSiteId || armoires.length === 0}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Enregistrement...' : 'Valider et Signer'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
