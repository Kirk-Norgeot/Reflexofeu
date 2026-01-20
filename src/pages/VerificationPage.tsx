import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { armoiresService } from '@/services/armoires.service';
import { releveService, releveSystemeService, relevePhotoService } from '@/services/releve.service';
import type { ReleveEtudeComplete, ReleveSysteme, RelevePhoto, ModeleSysteme } from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

interface ReleveWithDetails extends ReleveEtudeComplete {
  systemes: ReleveSysteme[];
  firstPhoto?: RelevePhoto;
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [releves, setReleves] = useState<ReleveWithDetails[]>([]);
  const [selectedReleve, setSelectedReleve] = useState('');
  const [loadingReleves, setLoadingReleves] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const selectedClientData = clients?.find((c) => c.id === selectedClient);
  const sites = selectedClientData?.sites || [];
  const isMultiSite = selectedClientData?.multi_site ?? false;

  // Pour les clients non-multi-sites, sélectionner automatiquement le site unique
  const effectiveSiteId = isMultiSite ? selectedSite : (sites[0]?.id || '');
  const canProceed = selectedClient && effectiveSiteId;

  useEffect(() => {
    const loadReleves = async () => {
      if (!effectiveSiteId) return;

      setLoadingReleves(true);
      try {
        const armoires = await armoiresService.getBySiteId(effectiveSiteId);
        const relevesPromises = armoires.map((armoire) =>
          releveService.getByArmoireId(armoire.id)
        );
        const relevesArrays = await Promise.all(relevesPromises);
        const allReleves = relevesArrays.flat();

        const relevesWithDetails = await Promise.all(
          allReleves.map(async (releve) => {
            const systemes = await releveSystemeService.getByReleveId(releve.id);
            const photos = await relevePhotoService.getByReleveId(releve.id);
            const firstPhoto = photos.sort((a, b) => a.position - b.position)[0];

            return {
              ...releve,
              systemes,
              firstPhoto,
            };
          })
        );

        setReleves(relevesWithDetails);
      } catch (error) {
        console.error('Erreur lors du chargement des relevés:', error);
      } finally {
        setLoadingReleves(false);
      }
    };

    loadReleves();
    setSelectedReleve('');
  }, [effectiveSiteId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Vérification</h2>
        <button
          onClick={() => navigate('/verification/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Vérification</span>
        </button>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recherche</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedSite('');
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
                onChange={(e) => setSelectedSite(e.target.value)}
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

        {canProceed && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3">Sélectionner une installation</h3>
            {loadingReleves && (
              <div className="text-center py-8">
                <p className="text-gray-500">Chargement des installations...</p>
              </div>
            )}
            {!loadingReleves && releves.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune installation disponible pour ce site</p>
              </div>
            )}
            {!loadingReleves && releves.length > 0 && (
              <div className="space-y-4">
                {(() => {
                  const groupedByDate = releves.reduce((acc, releve) => {
                    const dateKey = new Date(releve.date_releve).toLocaleDateString('fr-FR');
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(releve);
                    return acc;
                  }, {} as Record<string, typeof releves>);

                  return Object.entries(groupedByDate).map(([date, dateReleves]) => (
                    <div key={date} className="border rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                        className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-6 h-6 text-primary-600" />
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Installation du {date}</h3>
                            <p className="text-sm text-gray-600">
                              {dateReleves.length} armoire{dateReleves.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {expandedDate === date ? (
                          <ChevronUp className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )}
                      </button>

                      {expandedDate === date && (
                        <div className="px-4 pb-4 space-y-3 border-t pt-4">
                          {dateReleves.map((releve) => {
                            const volume = releve.armoire?.hauteur && releve.armoire?.longueur && releve.armoire?.profondeur
                              ? (releve.armoire.hauteur * releve.armoire.longueur * releve.armoire.profondeur).toFixed(2)
                              : releve.armoire?.volume?.toString() || '-';

                            const systemeSummary = releve.systemes.length > 0
                              ? releve.systemes.map((s) => {
                                  const modelLabel = MODELES.find((m) => m.value === s.modele)?.label || s.modele;
                                  return `${modelLabel}m³ (x${s.quantite})`;
                                }).join(', ')
                              : 'Aucun système';

                            return (
                              <div
                                key={releve.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                  selectedReleve === releve.id
                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                    : 'bg-white hover:bg-gray-50 border-gray-300 hover:shadow-md'
                                }`}
                                onClick={() => setSelectedReleve(releve.id)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex-shrink-0 w-20 h-20">
                                    {releve.firstPhoto ? (
                                      <img
                                        src={releve.firstPhoto.url_photo}
                                        alt="Photo armoire"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                                      {releve.armoire?.nom_armoire || 'Armoire sans nom'}
                                      {releve.armoire?.zone && (
                                        <span className="ml-2 text-sm font-normal text-gray-600">
                                          (Zone: {releve.armoire.zone})
                                        </span>
                                      )}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                      <span className="font-medium text-gray-700">
                                        L: {releve.armoire?.longueur || '-'}m
                                      </span>
                                      <span className="font-medium text-gray-700">
                                        H: {releve.armoire?.hauteur || '-'}m
                                      </span>
                                      <span className="font-medium text-gray-700">
                                        P: {releve.armoire?.profondeur || '-'}m
                                      </span>
                                      <span className="font-bold text-primary-600">
                                        V: {volume}m³
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-700">
                                      <span className="font-medium">Système:</span>{' '}
                                      <span className="text-blue-700">{systemeSummary}</span>
                                    </div>
                                  </div>

                                  {selectedReleve === releve.id && (
                                    <div className="flex-shrink-0">
                                      <div className="text-blue-600 font-bold">Sélectionné</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
