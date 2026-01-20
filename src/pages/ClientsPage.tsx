import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, Building2, Upload } from 'lucide-react';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import { formatDate } from '@/utils/format';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const handleDelete = async (id: string, nom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${nom}" ?`)) {
      try {
        await deleteClient.mutateAsync(id);
      } catch (error) {
        alert('Erreur lors de la suppression du client');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  const filteredClients = selectedLetter
    ? clients?.filter((client) =>
        client.nom.toUpperCase().startsWith(selectedLetter)
      )
    : clients;

  const availableLetters = new Set(
    clients?.map((client) => client.nom.charAt(0).toUpperCase()) || []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
        <div className="flex gap-3">
          <Link to="/clients/import" className="btn-secondary flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Importer Excel</span>
          </Link>
          <Link to="/clients/new" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Créer un client</span>
          </Link>
        </div>
      </div>

      {clients && clients.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-1 flex-wrap gap-y-2">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${
                selectedLetter === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              TOUS
            </button>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                disabled={!availableLetters.has(letter)}
                className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${
                  selectedLetter === letter
                    ? 'bg-primary-600 text-white'
                    : availableLetters.has(letter)
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {!clients || clients.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun client
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par créer votre premier client
          </p>
          <Link to="/clients/new" className="btn-primary inline-flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Créer un client</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients?.map((client) => (
            <div key={client.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {client.nom}
                  </h3>
                  {client.multi_site && (
                    <span className="badge bg-blue-100 text-blue-800">
                      Multi-sites
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/clients/${client.id}/edit`}
                    className="text-primary-600 hover:text-primary-800 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(client.id, client.nom)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{client.adresse}</p>
                    {client.adresse2 && (
                      <p className="text-gray-600">{client.adresse2}</p>
                    )}
                    <p className="text-gray-600">
                      {client.code_postal} {client.ville}
                    </p>
                  </div>
                </div>

                {client.contact && (
                  <p className="text-gray-600">
                    <span className="font-medium">Contact:</span> {client.contact}
                  </p>
                )}

                {client.telephone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Tél:</span> {client.telephone}
                  </p>
                )}

                {client.email && (
                  <p className="text-gray-600 truncate">
                    <span className="font-medium">Email:</span> {client.email}
                  </p>
                )}

                {client.sites && client.sites.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <p className="text-gray-600 font-medium">
                      {client.sites.length} site{client.sites.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                Créé le {formatDate(client.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
