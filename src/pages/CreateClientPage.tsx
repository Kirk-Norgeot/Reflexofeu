import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/useClients';
import { useCreateSite, useUpdateSite, useDeleteSite } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import { geocodeAddress } from '@/utils/geocoding';
import MapView from '@/components/MapView';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import type { Client, Site } from '@/types/database.types';

export default function CreateClientPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  const { data: clientData } = useClient(id);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    adresse2: '',
    code_postal: '',
    ville: '',
    contact: '',
    telephone: '',
    email: '',
    multi_site: false,
  });

  const [sites, setSites] = useState<Partial<Site>[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientData) {
      setFormData({
        nom: clientData.nom,
        adresse: clientData.adresse,
        adresse2: clientData.adresse2 || '',
        code_postal: clientData.code_postal,
        ville: clientData.ville,
        contact: clientData.contact || '',
        telephone: clientData.telephone || '',
        email: clientData.email || '',
        multi_site: clientData.multi_site,
      });
      if (clientData.sites) {
        setSites(clientData.sites);
      }
    }
  }, [clientData]);

  useEffect(() => {
    if (formData.adresse && formData.code_postal && formData.ville) {
      geocodeAddress(formData.adresse, formData.code_postal, formData.ville).then(
        (coords) => {
          if (coords) setCoordinates(coords);
        }
      );
    }
  }, [formData.adresse, formData.code_postal, formData.ville]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let clientId = id;

      if (isEditMode && id) {
        await updateClient.mutateAsync({ id, updates: formData });
      } else {
        const newClient = await createClient.mutateAsync({
          client: formData,
          userId: user.id,
        });
        clientId = newClient.id;
      }

      if (clientId) {
        if (formData.multi_site && sites.length > 0) {
          for (const site of sites) {
            const coords = await geocodeAddress(
              site.adresse || '',
              site.code_postal || '',
              site.ville || ''
            );

            const siteData = {
              ...site,
              client_id: clientId,
              latitude: coords?.latitude,
              longitude: coords?.longitude,
            };

            if (site.id) {
              await updateSite.mutateAsync({ id: site.id, updates: siteData });
            } else {
              await createSite.mutateAsync(siteData as Omit<Site, 'id' | 'created_at' | 'updated_at'>);
            }
          }
        } else if (!formData.multi_site && !isEditMode) {
          const uniqueSiteData = {
            client_id: clientId,
            nom: formData.nom,
            adresse: formData.adresse,
            code_postal: formData.code_postal,
            ville: formData.ville,
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude,
          };
          await createSite.mutateAsync(uniqueSiteData as Omit<Site, 'id' | 'created_at' | 'updated_at'>);
        }
      }

      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const addSite = () => {
    setSites([...sites, { nom: '', adresse: '', code_postal: '', ville: '' }]);
  };

  const removeSite = async (index: number) => {
    const site = sites[index];
    if (site.id) {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
        await deleteSite.mutateAsync(site.id);
      }
    }
    setSites(sites.filter((_, i) => i !== index));
  };

  const updateSiteField = (index: number, field: string, value: any) => {
    const newSites = [...sites];
    newSites[index] = { ...newSites[index], [field]: value };
    setSites(newSites);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clients')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Modifier le client' : 'Créer un client'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Informations client</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value.toUpperCase() })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Code postal *</label>
                  <input
                    type="text"
                    value={formData.code_postal}
                    onChange={(e) =>
                      setFormData({ ...formData, code_postal: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Ville *</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value.toUpperCase() })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <AddressAutocomplete
                  label="Adresse *"
                  value={formData.adresse}
                  onChange={(value) => {
                    setFormData({ ...formData, adresse: value });
                  }}
                  onSelectAddress={(address) => {
                    setFormData({
                      ...formData,
                      adresse: address.adresse,
                      code_postal: address.code_postal || formData.code_postal,
                      ville: address.ville || formData.ville,
                    });
                  }}
                  city={formData.ville}
                  postalCode={formData.code_postal}
                  companyName={formData.nom}
                  placeholder={formData.ville ? `Chercher une adresse à ${formData.ville}...` : "Commencez par saisir la ville..."}
                  required
                />
              </div>

              <div>
                <label className="label">Adresse 2</label>
                <input
                  type="text"
                  value={formData.adresse2}
                  onChange={(e) => setFormData({ ...formData, adresse2: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="multi_site"
                  checked={formData.multi_site}
                  onChange={(e) =>
                    setFormData({ ...formData, multi_site: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="multi_site" className="text-sm font-medium text-gray-700">
                  Multi site
                </label>
              </div>
            </div>
          </div>

          {formData.multi_site && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sites</h3>
                <button
                  type="button"
                  onClick={addSite}
                  className="btn-secondary flex items-center space-x-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un site</span>
                </button>
              </div>

              <div className="space-y-4">
                {sites.map((site, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeSite(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nom du site *"
                        value={site.nom || ''}
                        onChange={(e) => updateSiteField(index, 'nom', e.target.value)}
                        className="input text-sm"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Code postal *"
                          value={site.code_postal || ''}
                          onChange={(e) =>
                            updateSiteField(index, 'code_postal', e.target.value)
                          }
                          className="input text-sm"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Ville *"
                          value={site.ville || ''}
                          onChange={(e) => updateSiteField(index, 'ville', e.target.value.toUpperCase())}
                          className="input text-sm"
                          required
                        />
                      </div>
                      <AddressAutocomplete
                        value={site.adresse || ''}
                        onChange={(value) => {
                          updateSiteField(index, 'adresse', value);
                        }}
                        onSelectAddress={(address) => {
                          const newSites = [...sites];
                          newSites[index] = {
                            ...newSites[index],
                            adresse: address.adresse,
                            code_postal: address.code_postal || site.code_postal,
                            ville: address.ville || site.ville,
                          };
                          setSites(newSites);
                        }}
                        city={site.ville}
                        postalCode={site.code_postal}
                        companyName={formData.nom}
                        placeholder={site.ville ? `Chercher une adresse à ${site.ville}...` : "Commencez par saisir la ville..."}
                        required
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 flex-1 justify-center"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Sauvegarde...' : 'Valider'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Localisation</h3>
          {coordinates ? (
            <MapView
              latitude={coordinates.latitude}
              longitude={coordinates.longitude}
              className="h-[600px]"
            />
          ) : (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              Entrez une adresse pour voir la carte
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
