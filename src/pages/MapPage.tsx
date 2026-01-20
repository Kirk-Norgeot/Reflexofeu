import { useState, useEffect } from 'react';
import { useSites } from '@/hooks/useClients';
import { useClients } from '@/hooks/useClients';
import MapView from '@/components/MapView';
import type { Site } from '@/types/database.types';

export default function MapPage() {
  const { data: clients } = useClients();
  const { data: allSites } = useSites();
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [filters, setFilters] = useState({
    clientId: '',
    ville: '',
  });

  useEffect(() => {
    if (!allSites) return;

    let sites = allSites.filter((site) => site.latitude && site.longitude);

    if (filters.clientId) {
      sites = sites.filter((site) => site.client_id === filters.clientId);
    }

    if (filters.ville) {
      sites = sites.filter((site) =>
        site.ville.toLowerCase().includes(filters.ville.toLowerCase())
      );
    }

    setFilteredSites(sites);
  }, [allSites, filters]);

  const markers = filteredSites.map((site) => ({
    lat: site.latitude!,
    lng: site.longitude!,
    label: `${site.nom} - ${site.ville}`,
    id: site.id,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Carte des sites</h2>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client</label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="input"
            >
              <option value="">Tous les clients</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Ville</label>
            <input
              type="text"
              value={filters.ville}
              onChange={(e) => setFilters({ ...filters, ville: e.target.value })}
              className="input"
              placeholder="Rechercher une ville"
            />
          </div>

        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''} trouvé{filteredSites.length !== 1 ? 's' : ''}
          </h3>
        </div>
        {markers.length > 0 ? (
          <MapView markers={markers} className="h-[600px]" />
        ) : (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
            Aucun site avec coordonnées GPS
          </div>
        )}
      </div>

      {filteredSites.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Liste des sites</h3>
          <div className="space-y-3">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <h4 className="font-semibold text-gray-900">{site.nom}</h4>
                <p className="text-sm text-gray-600">
                  {site.adresse}, {site.code_postal} {site.ville}
                </p>
                {site.latitude && site.longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    GPS: {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
