import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Camera, Upload } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { armoiresService } from '@/services/armoires.service';
import { verificationService, verificationSystemeService, verificationPhotoService } from '@/services/verification.service';
import { uploadPhotoToStorage } from '@/utils/storage';
import CameraCapture from '@/components/CameraCapture';
import NumberSelector from '@/components/NumberSelector';
import ZoneSelector from '@/components/ZoneSelector';
import NumericInput from '@/components/NumericInput';
import DepthSelector from '@/components/DepthSelector';
import type { ModeleSysteme, TypeContact, TemperatureSprinkler, ArriveeCables, EtatTube } from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

const TEMPERATURES: TemperatureSprinkler[] = ['57', '68', '79'];

interface SystemeForm {
  id: string;
  modele: ModeleSysteme;
  quantite: number;
  tube: boolean;
  pressostat: boolean;
  pressostat_type: TypeContact | null;
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

export default function CreateVerificationPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [nomArmoire, setNomArmoire] = useState('');
  const [zone, setZone] = useState('');

  const [longueur, setLongueur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [profondeur, setProfondeur] = useState('');
  const [nbCellules, setNbCellules] = useState('');
  const [ventilation, setVentilation] = useState(false);
  const [nbVentilations, setNbVentilations] = useState('');
  const [arriveCables, setArriveCables] = useState<ArriveeCables | undefined>(undefined);

  const [dateVerification, setDateVerification] = useState(new Date().toISOString().split('T')[0]);
  const [commentaire, setCommentaire] = useState('');

  const [systemes, setSystemes] = useState<SystemeForm[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClientData = clients?.find((c) => c.id === selectedClient);
  const sites = selectedClientData?.sites || [];
  const isMultiSite = selectedClientData?.multi_site ?? false;
  const effectiveSiteId = isMultiSite ? selectedSite : (sites[0]?.id || '');

  const handleAddSysteme = () => {
    setSystemes([
      ...systemes,
      {
        id: `temp-${Date.now()}`,
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
      },
    ]);
  };

  const handleRemoveSysteme = (id: string) => {
    setSystemes(systemes.filter((s) => s.id !== id));
  };

  const handleSystemeChange = (id: string, field: keyof SystemeForm, value: any) => {
    setSystemes(
      systemes.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  const handlePhotoCapture = async (photoDataUrl: string) => {
    try {
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const photoUrl = await uploadPhotoToStorage(file, 'verification-photos');

      if (!photoUrl) {
        alert('Erreur lors de la sauvegarde de la photo');
        return;
      }

      setPhotos([...photos, photoUrl]);
      setCapturingPhoto(false);
    } catch (error) {
      console.error('Erreur lors de la capture photo:', error);
      alert('Erreur lors de la sauvegarde de la photo');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const photoUrl = await uploadPhotoToStorage(file, 'verification-photos');
        return photoUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      setPhotos([...photos, ...validUrls]);
    } catch (error) {
      console.error('Erreur lors de l\'upload des photos:', error);
      alert('Erreur lors de l\'upload des photos');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveSiteId) {
      alert('Veuillez sélectionner un client et un site');
      return;
    }

    if (!nomArmoire.trim()) {
      alert('Veuillez entrer un nom pour l\'armoire');
      return;
    }

    if (systemes.length === 0) {
      alert('Veuillez ajouter au moins un système');
      return;
    }

    setSaving(true);
    try {
      const volume = longueur && hauteur && profondeur
        ? parseFloat(longueur) * parseFloat(hauteur) * parseFloat(profondeur)
        : null;

      const armoire = await armoiresService.create({
        site_id: effectiveSiteId,
        nom_armoire: nomArmoire,
        zone: zone || undefined,
        longueur: longueur ? parseFloat(longueur) : undefined,
        hauteur: hauteur ? parseFloat(hauteur) : undefined,
        profondeur: profondeur ? parseFloat(profondeur) : undefined,
        volume: volume || undefined,
        nb_cellules: nbCellules ? parseInt(nbCellules) : undefined,
        ventilation,
        nb_ventilations: nbVentilations ? parseInt(nbVentilations) : undefined,
        arrivee_cables: arriveCables,
      });

      const verification = await verificationService.create({
        armoire_id: armoire.id,
        date_verification: dateVerification,
        statut: 'fait',
        commentaire: commentaire || undefined,
      });

      for (const systeme of systemes) {
        await verificationSystemeService.create({
          verification_id: verification.id,
          modele: systeme.modele,
          quantite: systeme.quantite,
          tube: systeme.tube,
          pressostat: systeme.pressostat,
          pressostat_type: systeme.pressostat_type || undefined,
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

      for (let i = 0; i < photos.length; i++) {
        await verificationPhotoService.create({
          verification_id: verification.id,
          url_photo: photos[i],
          position: i + 1,
        });
      }

      alert('Vérification créée avec succès');
      navigate('/verification');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la vérification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Nouvelle Vérification</h2>
        <button
          onClick={() => navigate('/verification')}
          className="btn-secondary"
        >
          Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Informations Client</h3>
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
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="input"
                  disabled={!selectedClient}
                  required
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Informations Armoire</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nom de l'armoire *</label>
              <input
                type="text"
                value={nomArmoire}
                onChange={(e) => setNomArmoire(e.target.value)}
                className="input"
                placeholder="Ex: TGBT Principal"
                required
              />
            </div>
            <div>
              <ZoneSelector
                value={zone}
                onChange={(value) => setZone(value)}
                label="Zone"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Dimensions (Optionnel)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <NumericInput
              label="Longueur (m)"
              value={longueur}
              onChange={(value) => setLongueur(value)}
            />

            <NumericInput
              label="Hauteur (m)"
              value={hauteur}
              onChange={(value) => setHauteur(value)}
            />

            <DepthSelector
              label="Profondeur (m)"
              value={profondeur}
              onChange={(value) => setProfondeur(value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <NumberSelector
                value={nbCellules ? Number(nbCellules) : 1}
                onChange={(value) => setNbCellules(value.toString())}
                label="Nb de cellules"
                min={1}
                max={8}
              />
            </div>
            <div>
              <label className="label">Arrivée câbles</label>
              <select
                value={arriveCables || ''}
                onChange={(e) => setArriveCables(e.target.value as ArriveeCables || undefined)}
                className="input"
              >
                <option value="">Non renseigné</option>
                <option value="Haut">Haut</option>
                <option value="Bas">Bas</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ventilation"
                checked={ventilation}
                onChange={(e) => setVentilation(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="ventilation" className="text-sm font-medium text-gray-700">
                Ventilation
              </label>
            </div>

            {ventilation && (
              <div>
                <NumberSelector
                  value={nbVentilations ? Number(nbVentilations) : 1}
                  onChange={(value) => setNbVentilations(value.toString())}
                  label="Nb de ventilations"
                  min={1}
                  max={8}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Systèmes Installés *</h3>
            <button
              type="button"
              onClick={handleAddSysteme}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un système</span>
            </button>
          </div>

          {systemes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun système ajouté. Cliquez sur "Ajouter un système" pour commencer.
            </p>
          ) : (
            <div className="space-y-4">
              {systemes.map((systeme, index) => (
                <div key={systeme.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Système {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveSysteme(systeme.id)}
                      className="text-red-600 hover:text-red-700"
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
                            onClick={() => handleSystemeChange(systeme.id, 'modele', m.value)}
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
                        onChange={(value) => handleSystemeChange(systeme.id, 'quantite', value)}
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
                        id={`tube-${systeme.id}`}
                        checked={systeme.tube}
                        onChange={(e) => handleSystemeChange(systeme.id, 'tube', e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 rounded"
                      />
                      <label htmlFor={`tube-${systeme.id}`} className="text-sm font-medium text-gray-700">
                        Tube
                      </label>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`pressostat-${systeme.id}`}
                          checked={systeme.pressostat}
                          onChange={(e) => handleSystemeChange(systeme.id, 'pressostat', e.target.checked)}
                          className="mr-2 h-4 w-4 text-primary-600 rounded"
                        />
                        <label htmlFor={`pressostat-${systeme.id}`} className="text-sm font-medium text-gray-700">
                          Pressostat NO/NF
                        </label>
                      </div>
                      {systeme.pressostat && (
                        <div className="ml-6 space-y-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSystemeChange(systeme.id, 'pressostat_type', 'NO')}
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
                              onClick={() => handleSystemeChange(systeme.id, 'pressostat_type', 'NO/NF')}
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
                            onChange={(value) => handleSystemeChange(systeme.id, 'pressostat_quantite', value)}
                            label="Quantité"
                            min={1}
                            max={8}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`tete-${systeme.id}`}
                          checked={systeme.tete_sprinkler}
                          onChange={(e) => handleSystemeChange(systeme.id, 'tete_sprinkler', e.target.checked)}
                          className="mr-2 h-4 w-4 text-primary-600 rounded"
                        />
                        <label htmlFor={`tete-${systeme.id}`} className="text-sm font-medium text-gray-700">
                          Tête sprinkler
                        </label>
                      </div>
                      {systeme.tete_sprinkler && (
                        <div className="ml-6 space-y-2">
                          <div>
                            <NumberSelector
                              value={systeme.tete_sprinkler_quantite}
                              onChange={(value) => handleSystemeChange(systeme.id, 'tete_sprinkler_quantite', value)}
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
                                  onClick={() => handleSystemeChange(systeme.id, 'tete_sprinkler_temperature', t)}
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
                          id={`sirene-${systeme.id}`}
                          checked={systeme.sirene_flash}
                          onChange={(e) => handleSystemeChange(systeme.id, 'sirene_flash', e.target.checked)}
                          className="mr-2 h-4 w-4 text-primary-600 rounded"
                        />
                        <label htmlFor={`sirene-${systeme.id}`} className="text-sm font-medium text-gray-700">
                          Sirène flash
                        </label>
                      </div>
                      {systeme.sirene_flash && (
                        <div className="ml-6">
                          <NumberSelector
                            value={systeme.sirene_flash_quantite}
                            onChange={(value) => handleSystemeChange(systeme.id, 'sirene_flash_quantite', value)}
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
                        id={`panneau-${systeme.id}`}
                        checked={systeme.panneau}
                        onChange={(e) => handleSystemeChange(systeme.id, 'panneau', e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 rounded"
                      />
                      <label htmlFor={`panneau-${systeme.id}`} className="text-sm font-medium text-gray-700">
                        Panneau
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`contact-${systeme.id}`}
                        checked={systeme.contact_nf_suppl}
                        onChange={(e) => handleSystemeChange(systeme.id, 'contact_nf_suppl', e.target.checked)}
                        className="mr-2 h-4 w-4 text-primary-600 rounded"
                      />
                      <label htmlFor={`contact-${systeme.id}`} className="text-sm font-medium text-gray-700">
                        Contact NF Suppl.
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-semibold text-gray-800 mb-3">Contrôles de Vérification</h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label text-sm">Pression OK</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={systeme.pression_ok === true}
                              onChange={() => handleSystemeChange(systeme.id, 'pression_ok', true)}
                              className="mr-2"
                            />
                            <span className="text-sm">Oui</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={systeme.pression_ok === false}
                              onChange={() => handleSystemeChange(systeme.id, 'pression_ok', false)}
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
                          onChange={(e) => handleSystemeChange(systeme.id, 'etat_tube', e.target.value as EtatTube)}
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
                              onChange={() => handleSystemeChange(systeme.id, 'tete_sprinkler_ok', true)}
                              className="mr-2"
                            />
                            <span className="text-sm">Oui</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={systeme.tete_sprinkler_ok === false}
                              onChange={() => handleSystemeChange(systeme.id, 'tete_sprinkler_ok', false)}
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
                              onChange={() => handleSystemeChange(systeme.id, 'sirene_flash_ok', true)}
                              className="mr-2"
                            />
                            <span className="text-sm">Oui</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={systeme.sirene_flash_ok === false}
                              onChange={() => handleSystemeChange(systeme.id, 'sirene_flash_ok', false)}
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
                              onChange={() => handleSystemeChange(systeme.id, 'batterie_changee', true)}
                              className="mr-2"
                            />
                            <span className="text-sm">Oui</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={systeme.batterie_changee === false}
                              onChange={() => handleSystemeChange(systeme.id, 'batterie_changee', false)}
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
                                  handleSystemeChange(systeme.id, 'etat_environnement', newEnv);
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
                                  handleSystemeChange(systeme.id, 'etat_environnement', newEnv);
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
                                  handleSystemeChange(systeme.id, 'etat_environnement', newEnv);
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
                              onChange={(e) => handleSystemeChange(systeme.id, 'etat_environnement_autre', e.target.value)}
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
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Informations Vérification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="label">Commentaire</label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="input"
                rows={3}
                placeholder="Observations, remarques..."
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Photos ({photos.length})</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  crossOrigin="anonymous"
                  className="w-full h-32 object-cover rounded border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
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
              onClick={() => setCapturingPhoto(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Prendre une photo</span>
            </button>
            <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
              <Upload className="w-5 h-5" />
              <span>Ajouter des fichiers</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/verification')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Enregistrement...' : 'Créer la vérification'}</span>
          </button>
        </div>
      </form>

      {capturingPhoto && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setCapturingPhoto(false)}
        />
      )}
    </div>
  );
}
