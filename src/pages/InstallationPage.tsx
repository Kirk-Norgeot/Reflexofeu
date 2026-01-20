import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Camera, CheckCircle, ArrowRight, ArrowLeft, FileSignature } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { releveService, releveSystemeService, relevePhotoService } from '@/services/releve.service';
import { installationService, installationSystemeService, installationPhotoService } from '@/services/installation.service';
import { uploadPhotoToStorage } from '@/utils/storage';
import { formatDate } from '@/utils/format';
import CameraCapture from '@/components/CameraCapture';
import type { ReleveEtudeComplete, ReleveSysteme, RelevePhoto, ModeleSysteme, Installation } from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

interface ArmoireInstallation {
  releve: ReleveEtudeComplete;
  systemes: ReleveSysteme[];
  photos: RelevePhoto[];
  installation?: Installation;
  installationPhotos: string[];
}

export default function InstallationPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [releves, setReleves] = useState<ReleveEtudeComplete[]>([]);
  const [selectedReleves, setSelectedReleves] = useState<string[]>([]);
  const [armoires, setArmoires] = useState<ArmoireInstallation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  const selectedClientData = clients?.find((c) => c.id === selectedClient);
  const sites = selectedClientData?.sites || [];
  const isMultiSite = selectedClientData?.multi_site ?? false;
  const effectiveSiteId = isMultiSite ? selectedSite : (sites[0]?.id || '');
  const canProceed = selectedClient && effectiveSiteId;

  const currentArmoire = armoires[currentIndex];
  const allInstalled = armoires.every(a => a.installation?.statut === 'fait');
  const canInstall = currentArmoire !== undefined;

  useEffect(() => {
    setEditingDate(false);
  }, [currentIndex]);

  useEffect(() => {
    const loadReleves = async () => {
      if (!effectiveSiteId) return;

      setLoading(true);
      try {
        const siteReleves = await releveService.getBySiteId(effectiveSiteId);
        const completedReleves = siteReleves.filter(r => r.statut === 'completée');
        setReleves(completedReleves);
      } catch (error) {
        console.error('Erreur lors du chargement des relevés:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReleves();
  }, [effectiveSiteId]);

  const toggleReleveSelection = (releveId: string) => {
    setSelectedReleves(prev => {
      if (prev.includes(releveId)) {
        return prev.filter(id => id !== releveId);
      } else {
        return [...prev, releveId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedReleves(releves.map(r => r.id));
  };

  const handleDeselectAll = () => {
    setSelectedReleves([]);
  };

  const handleInstallAll = async () => {
    if (!armoires.length) return;

    const confirmed = confirm(
      `Voulez-vous vraiment marquer toutes les ${armoires.length} armoires comme installées ?`
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const updatedArmoires = [...armoires];

      for (let i = 0; i < armoires.length; i++) {
        const armoire = armoires[i];
        if (armoire.installation && armoire.installation.statut !== 'fait') {
          await installationService.update(armoire.installation.id, {
            statut: 'fait',
          });

          updatedArmoires[i] = {
            ...armoire,
            installation: {
              ...armoire.installation,
              statut: 'fait',
            },
          };
        }
      }

      setArmoires(updatedArmoires);
      alert('Toutes les installations ont été validées avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation groupée');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSelectedReleves = async () => {
    if (selectedReleves.length === 0) {
      alert('Veuillez sélectionner au moins un relevé');
      return;
    }

    setLoading(true);
    try {
      const armoiresData: ArmoireInstallation[] = [];

      for (const releveId of selectedReleves) {
        const releve = await releveService.getById(releveId);
        if (!releve) continue;

        const systemes = await releveSystemeService.getByReleveId(releveId);
        const photos = await relevePhotoService.getByReleveId(releveId);

        let existingInstallation = await installationService.getByReleveId(releveId);

        if (!existingInstallation && releve.armoire) {
          existingInstallation = await installationService.create({
            armoire_id: releve.armoire.id,
            releve_etude_id: releveId,
            date_installation: new Date().toISOString().split('T')[0],
            statut: 'en cours',
          });

          for (const systeme of systemes) {
            await installationSystemeService.create({
              installation_id: existingInstallation.id,
              modele: systeme.modele,
              quantite: systeme.quantite,
              tube: systeme.tube,
              pressostat: systeme.pressostat,
              pressostat_type: systeme.pressostat_type,
              pressostat_quantite: systeme.pressostat_quantite,
              tete_sprinkler: systeme.tete_sprinkler,
              tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
              tete_sprinkler_temperature: systeme.tete_sprinkler_temperature,
              sirene_flash: systeme.sirene_flash,
              sirene_flash_quantite: systeme.sirene_flash_quantite,
              panneau: false,
              contact_nf_suppl: false,
            });
          }
        } else if (existingInstallation) {
          const existingSystemes = await installationSystemeService.getByInstallationId(existingInstallation.id);

          if (existingSystemes.length === 0) {
            for (const systeme of systemes) {
              await installationSystemeService.create({
                installation_id: existingInstallation.id,
                modele: systeme.modele,
                quantite: systeme.quantite,
                tube: systeme.tube,
                pressostat: systeme.pressostat,
                pressostat_type: systeme.pressostat_type,
                pressostat_quantite: systeme.pressostat_quantite,
                tete_sprinkler: systeme.tete_sprinkler,
                tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
                tete_sprinkler_temperature: systeme.tete_sprinkler_temperature,
                sirene_flash: systeme.sirene_flash,
                sirene_flash_quantite: systeme.sirene_flash_quantite,
                panneau: false,
                contact_nf_suppl: false,
              });
            }
          }
        }

        const installationPhotos = existingInstallation
          ? await installationPhotoService.getByInstallationId(existingInstallation.id)
          : [];

        armoiresData.push({
          releve,
          systemes,
          photos,
          installation: existingInstallation || undefined,
          installationPhotos: installationPhotos.map(p => p.url_photo),
        });
      }

      setArmoires(armoiresData);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = async (photoDataUrl: string) => {
    if (!currentArmoire || !currentArmoire.installation) return;

    try {
      const blob = await fetch(photoDataUrl).then((res) => res.blob());
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const photoUrl = await uploadPhotoToStorage(file, 'installation-photos');

      if (!photoUrl) {
        alert('Erreur lors de la sauvegarde de la photo');
        return;
      }

      const position = currentArmoire.installationPhotos.length + 1;

      await installationPhotoService.create({
        installation_id: currentArmoire.installation.id,
        url_photo: photoUrl,
        position,
      });

      const updatedArmoires = [...armoires];
      updatedArmoires[currentIndex] = {
        ...currentArmoire,
        installationPhotos: [...currentArmoire.installationPhotos, photoUrl],
      };
      setArmoires(updatedArmoires);
      setCapturingPhoto(false);
    } catch (error) {
      console.error('Erreur lors de la capture photo:', error);
      alert('Erreur lors de la sauvegarde de la photo');
    }
  };

  const handleUpdateDate = async (newDate: string) => {
    if (!currentArmoire || !currentArmoire.installation) return;

    setSaving(true);
    try {
      await installationService.update(currentArmoire.installation.id, {
        date_installation: newDate,
      });

      const updatedArmoires = [...armoires];
      updatedArmoires[currentIndex] = {
        ...currentArmoire,
        installation: {
          ...currentArmoire.installation,
          date_installation: newDate,
        },
      };
      setArmoires(updatedArmoires);
      setEditingDate(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour de la date');
    } finally {
      setSaving(false);
    }
  };

  const handleInstall = async () => {
    if (!currentArmoire || !currentArmoire.installation || !canInstall) return;

    setSaving(true);
    try {
      await installationService.update(currentArmoire.installation.id, {
        statut: 'fait',
      });

      const updatedArmoires = [...armoires];
      updatedArmoires[currentIndex] = {
        ...currentArmoire,
        installation: {
          ...currentArmoire.installation,
          statut: 'fait',
        },
      };
      setArmoires(updatedArmoires);

      if (currentIndex < armoires.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = () => {
    if (!effectiveSiteId) return;
    navigate(`/installation/${effectiveSiteId}/signature`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Installation</h2>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Sélection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedSite('');
                setSelectedReleves([]);
                setArmoires([]);
              }}
              className="input"
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
              <label className="label">Site</label>
              <select
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                  setSelectedReleves([]);
                  setArmoires([]);
                }}
                className="input"
                disabled={!selectedClient}
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

      {canProceed && armoires.length === 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Relevés complétés</h3>
          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : releves.length === 0 ? (
            <p className="text-gray-500">Aucun relevé complété disponible</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {releves.map((releve) => (
                  <label
                    key={releve.id}
                    className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReleves.includes(releve.id)}
                      onChange={() => toggleReleveSelection(releve.id)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{releve.armoire?.nom_armoire}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(releve.date_releve)}
                        {releve.armoire?.zone && ` • Zone: ${releve.armoire.zone}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    disabled={selectedReleves.length === releves.length}
                    className="btn-secondary text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    disabled={selectedReleves.length === 0}
                    className="btn-secondary text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tout désélectionner
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedReleves.length} relevé{selectedReleves.length > 1 ? 's' : ''} sélectionné{selectedReleves.length > 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={handleLoadSelectedReleves}
                    disabled={selectedReleves.length === 0}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Charger la sélection
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {currentArmoire && (
        <>
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-900">
                Installation en cours
              </h3>
              {currentArmoire.installation?.statut === 'fait' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Installée
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Armoire</h4>
                <p className="text-lg font-medium">{currentArmoire.releve.armoire?.nom_armoire}</p>
                {currentArmoire.releve.armoire?.zone && (
                  <p className="text-sm text-gray-600">Zone: {currentArmoire.releve.armoire.zone}</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Date d'installation</h4>
                {editingDate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      defaultValue={currentArmoire.installation?.date_installation}
                      onChange={(e) => handleUpdateDate(e.target.value)}
                      className="input"
                      disabled={saving}
                    />
                    <button
                      onClick={() => setEditingDate(false)}
                      className="btn-secondary text-sm"
                      disabled={saving}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">
                      {currentArmoire.installation?.date_installation
                        ? formatDate(currentArmoire.installation.date_installation)
                        : 'Non définie'}
                    </p>
                    <button
                      onClick={() => setEditingDate(true)}
                      className="btn-secondary text-sm"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Systèmes à installer</h4>
                <div className="space-y-2">
                  {currentArmoire.systemes.map((systeme, idx) => (
                    <div key={idx} className="p-3 bg-white rounded border text-sm">
                      <div className="font-medium">
                        {MODELES.find(m => m.value === systeme.modele)?.label}m³ (Quantité: {systeme.quantite})
                      </div>
                      <div className="text-gray-600 mt-1 space-x-3">
                        {systeme.tube && <span>• Tube</span>}
                        {systeme.pressostat && <span>• Pressostat {systeme.pressostat_type}</span>}
                        {systeme.tete_sprinkler && (
                          <span>• Têtes sprinkler: {systeme.tete_sprinkler_quantite} ({systeme.tete_sprinkler_temperature}°)</span>
                        )}
                        {systeme.sirene_flash && <span>• Sirène/Flash</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Photos d'installation ({currentArmoire.installationPhotos.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {currentArmoire.installationPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      crossOrigin="anonymous"
                      className="w-full h-32 object-cover rounded border-2 border-gray-200"
                    />
                  ))}
                </div>
                {currentArmoire.installation?.statut !== 'fait' && (
                  <button
                    onClick={() => setCapturingPhoto(true)}
                    className="btn-secondary mt-3 flex items-center space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Prendre une photo</span>
                  </button>
                )}
              </div>
            </div>

            {currentArmoire.installation?.statut !== 'fait' && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleInstall}
                  disabled={!canInstall || saving}
                  className="btn-primary flex items-center space-x-2 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{saving ? 'Enregistrement...' : 'Marquer comme installé'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Précédent</span>
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Armoire {currentIndex + 1} sur {armoires.length}
                </p>
                {!allInstalled && armoires.length > 1 && (
                  <button
                    onClick={handleInstallAll}
                    disabled={saving}
                    className="btn-secondary mt-2 flex items-center space-x-2 mx-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{saving ? 'Validation...' : 'Tout valider'}</span>
                  </button>
                )}
                {allInstalled && (
                  <button
                    onClick={handleFinalize}
                    className="btn-primary mt-2 flex items-center space-x-2 mx-auto"
                  >
                    <FileSignature className="w-5 h-5" />
                    <span>Finaliser et Signer</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setCurrentIndex(Math.min(armoires.length - 1, currentIndex + 1))}
                disabled={currentIndex >= armoires.length - 1}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Suivant</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {capturingPhoto && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setCapturingPhoto(false)}
        />
      )}
    </div>
  );
}
