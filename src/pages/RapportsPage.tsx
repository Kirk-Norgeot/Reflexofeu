import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, User, Eye, Edit2, Check, X } from 'lucide-react';
import { useClients, useSitesByClient } from '@/hooks/useClients';
import { releveService } from '@/services/releve.service';
import { installationService } from '@/services/installation.service';
import { verificationService } from '@/services/verification.service';
import { signatureService, installationSignatureService } from '@/services/signature.service';
import { armoiresService } from '@/services/armoires.service';
import { sitesService } from '@/services/clients.service';
import type { ReleveEtudeComplete, InstallationComplete, VerificationComplete, Client, Site } from '@/types/database.types';

type ReportType = 'releves' | 'installations' | 'verifications';

interface SignedReleve {
  releve: ReleveEtudeComplete;
  signedAt: string;
  sessionId: string | null;
  clientName?: string;
  siteName?: string;
}

interface SignedInstallation {
  installation: InstallationComplete;
  siteId: string;
  signedAt: string;
  clientName?: string;
  siteName?: string;
}

interface VerificationWithDetails extends VerificationComplete {
  clientName?: string;
  siteName?: string;
  armoireName?: string;
}

export default function RapportsPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const [activeTab, setActiveTab] = useState<ReportType>('releves');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [signedReleves, setSignedReleves] = useState<SignedReleve[]>([]);
  const [signedInstallations, setSignedInstallations] = useState<SignedInstallation[]>([]);
  const [verifications, setVerifications] = useState<VerificationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingInstallationId, setEditingInstallationId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [savingDate, setSavingDate] = useState(false);
  const [showDateUpdateDialog, setShowDateUpdateDialog] = useState(false);
  const [pendingDateUpdate, setPendingDateUpdate] = useState<{ installationId: string; siteId: string } | null>(null);

  const years = ['2024', '2025', '2026'];
  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  useEffect(() => {
    loadReports();
  }, [selectedClient, activeTab]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'releves') {
        if (selectedClient) {
          await loadSignedReleves(selectedClient);
        } else {
          await loadAllSignedReleves();
        }
      } else if (activeTab === 'installations') {
        if (selectedClient) {
          await loadSignedInstallations(selectedClient);
        } else {
          await loadAllSignedInstallations();
        }
      } else if (activeTab === 'verifications') {
        if (selectedClient) {
          await loadVerifications(selectedClient);
        } else {
          await loadAllVerifications();
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSignedReleves = async (clientId: string) => {
    const allReleves: SignedReleve[] = [];

    const sites = await sitesService.getByClientId(clientId);

    for (const site of sites) {
      const armoires = await armoiresService.getBySiteId(site.id);

      for (const armoire of armoires) {
        const releves = await releveService.getByArmoireId(armoire.id);

        for (const releve of releves) {
          const signature = releve.session_id
            ? await signatureService.getBySessionId(releve.session_id)
            : await signatureService.getByReleveId(releve.id);

          if (signature) {
            allReleves.push({
              releve: { ...releve, armoire },
              signedAt: signature.signed_at,
              sessionId: releve.session_id || null,
            });
          }
        }
      }
    }

    setSignedReleves(allReleves);
  };

  const loadSignedInstallations = async (clientId: string) => {
    const allInstallations: SignedInstallation[] = [];

    const sites = await sitesService.getByClientId(clientId);

    for (const site of sites) {
      const signature = await installationSignatureService.getBySiteId(site.id);

      if (signature) {
        const armoires = await armoiresService.getBySiteId(site.id);

        for (const armoire of armoires) {
          const installations = await installationService.getByArmoireId(armoire.id);

          for (const installation of installations) {
            if (installation.statut === 'fait') {
              allInstallations.push({
                installation: { ...installation, armoire } as InstallationComplete,
                siteId: site.id,
                signedAt: signature.signed_at,
              });
            }
          }
        }
      }
    }

    setSignedInstallations(allInstallations);
  };

  const loadVerifications = async (clientId: string) => {
    const allVerifications: VerificationWithDetails[] = [];

    const client = clients?.find(c => c.id === clientId);
    const sites = await sitesService.getByClientId(clientId);

    for (const site of sites) {
      const armoires = await armoiresService.getBySiteId(site.id);

      for (const armoire of armoires) {
        const verif = await verificationService.getByArmoireId(armoire.id);
        if (verif && verif.statut === 'fait') {
          allVerifications.push({
            ...verif,
            clientName: client?.nom,
            siteName: site.nom,
            armoireName: armoire.nom_armoire,
          });
        }
      }
    }

    setVerifications(allVerifications);
  };

  const loadAllSignedReleves = async () => {
    const allReleves: SignedReleve[] = [];

    if (!clients) return;

    for (const client of clients) {
      const sites = await sitesService.getByClientId(client.id);

      for (const site of sites) {
        const armoires = await armoiresService.getBySiteId(site.id);

        for (const armoire of armoires) {
          const releves = await releveService.getByArmoireId(armoire.id);

          for (const releve of releves) {
            const signature = releve.session_id
              ? await signatureService.getBySessionId(releve.session_id)
              : await signatureService.getByReleveId(releve.id);

            if (signature) {
              allReleves.push({
                releve: { ...releve, armoire },
                signedAt: signature.signed_at,
                sessionId: releve.session_id || null,
                clientName: client.nom,
                siteName: site.nom,
              });
            }
          }
        }
      }
    }

    setSignedReleves(allReleves);
  };

  const loadAllSignedInstallations = async () => {
    const allInstallations: SignedInstallation[] = [];

    if (!clients) return;

    for (const client of clients) {
      const sites = await sitesService.getByClientId(client.id);

      for (const site of sites) {
        const signature = await installationSignatureService.getBySiteId(site.id);

        if (signature) {
          const armoires = await armoiresService.getBySiteId(site.id);

          for (const armoire of armoires) {
            const installations = await installationService.getByArmoireId(armoire.id);

            for (const installation of installations) {
              if (installation.statut === 'fait') {
                allInstallations.push({
                  installation: { ...installation, armoire } as InstallationComplete,
                  siteId: site.id,
                  signedAt: signature.signed_at,
                  clientName: client.nom,
                  siteName: site.nom,
                });
              }
            }
          }
        }
      }
    }

    setSignedInstallations(allInstallations);
  };

  const loadAllVerifications = async () => {
    const allVerifications: VerificationWithDetails[] = [];

    if (!clients) return;

    for (const client of clients) {
      const sites = await sitesService.getByClientId(client.id);

      for (const site of sites) {
        const armoires = await armoiresService.getBySiteId(site.id);

        for (const armoire of armoires) {
          const verif = await verificationService.getByArmoireId(armoire.id);
          if (verif && verif.statut === 'fait') {
            allVerifications.push({
              ...verif,
              clientName: client.nom,
              siteName: site.nom,
              armoireName: armoire.nom_armoire,
            });
          }
        }
      }
    }

    setVerifications(allVerifications);
  };

  const handleStartEditDate = (installationId: string, currentDate: string) => {
    setEditingInstallationId(installationId);
    setEditingDate(currentDate);
  };

  const handleCancelEditDate = () => {
    setEditingInstallationId(null);
    setEditingDate('');
  };

  const handleSaveDate = async (installationId: string, siteId: string) => {
    if (!editingDate) return;

    const installationsInSameSite = signedInstallations.filter(item => item.siteId === siteId);

    if (installationsInSameSite.length > 1) {
      setPendingDateUpdate({ installationId, siteId });
      setShowDateUpdateDialog(true);
    } else {
      await updateSingleInstallationDate(installationId);
    }
  };

  const updateSingleInstallationDate = async (installationId: string) => {
    if (!editingDate) return;

    setSavingDate(true);
    try {
      await installationService.update(installationId, {
        date_installation: editingDate,
      });

      const updatedInstallations = signedInstallations.map(item => {
        if (item.installation.id === installationId) {
          return {
            ...item,
            installation: {
              ...item.installation,
              date_installation: editingDate,
            },
          };
        }
        return item;
      });

      setSignedInstallations(updatedInstallations);
      setEditingInstallationId(null);
      setEditingDate('');
      setShowDateUpdateDialog(false);
      setPendingDateUpdate(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la date:', error);
      alert('Erreur lors de la mise à jour de la date');
    } finally {
      setSavingDate(false);
    }
  };

  const updateAllInstallationsDate = async (siteId: string) => {
    if (!editingDate) return;

    setSavingDate(true);
    try {
      const installationsToUpdate = signedInstallations.filter(item => item.siteId === siteId);

      for (const item of installationsToUpdate) {
        await installationService.update(item.installation.id, {
          date_installation: editingDate,
        });
      }

      const updatedInstallations = signedInstallations.map(item => {
        if (item.siteId === siteId) {
          return {
            ...item,
            installation: {
              ...item.installation,
              date_installation: editingDate,
            },
          };
        }
        return item;
      });

      setSignedInstallations(updatedInstallations);
      setEditingInstallationId(null);
      setEditingDate('');
      setShowDateUpdateDialog(false);
      setPendingDateUpdate(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des dates:', error);
      alert('Erreur lors de la mise à jour des dates');
    } finally {
      setSavingDate(false);
    }
  };

  const filterByDate = <T extends { signedAt?: string; date_verification?: string }>(items: T[]) => {
    return items.filter(item => {
      const date = item.signedAt || item.date_verification;
      if (!date) return false;

      const itemDate = new Date(date);
      const itemYear = itemDate.getFullYear().toString();
      const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');

      if (selectedYear && itemYear !== selectedYear) return false;
      if (selectedMonth && itemMonth !== selectedMonth) return false;

      return true;
    });
  };

  const groupBySession = (releves: SignedReleve[]) => {
    const grouped = new Map<string, SignedReleve[]>();
    const singles: SignedReleve[] = [];

    releves.forEach(item => {
      if (item.sessionId) {
        if (!grouped.has(item.sessionId)) {
          grouped.set(item.sessionId, []);
        }
        grouped.get(item.sessionId)!.push(item);
      } else {
        singles.push(item);
      }
    });

    return { sessions: Array.from(grouped.values()), singles };
  };

  const groupBySite = (installations: SignedInstallation[]) => {
    const grouped = new Map<string, SignedInstallation[]>();

    installations.forEach(item => {
      if (!grouped.has(item.siteId)) {
        grouped.set(item.siteId, []);
      }
      grouped.get(item.siteId)!.push(item);
    });

    return Array.from(grouped.values());
  };

  const selectedClientData = clients?.find(c => c.id === selectedClient);

  const filteredReleves = filterByDate(signedReleves);
  const { sessions: releveSessions, singles: releveSingles } = groupBySession(filteredReleves);

  const filteredInstallations = filterByDate(signedInstallations);
  const installationGroups = groupBySite(filteredInstallations);

  const filteredVerifications = filterByDate(verifications);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Rapports</h2>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('releves')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'releves'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Relevés d'études signés
            </button>
            <button
              onClick={() => setActiveTab('installations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'installations'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rapports installation
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'verifications'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rapports vérification
            </button>
          </nav>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Client</span>
            </label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedYear('');
                setSelectedMonth('');
              }}
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
            <label className="label flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Année</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input"
            >
              <option value="">Toutes les années</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Mois</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input"
              disabled={!selectedYear}
            >
              <option value="">Tous les mois</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des rapports...</p>
          </div>
        ) : (
            <>
              {activeTab === 'releves' && (
                <>
                  {releveSessions.length === 0 && releveSingles.length === 0 ? (
                    <div className="card text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun relevé signé
                      </h3>
                      <p className="text-gray-600">
                        Aucun relevé signé trouvé pour les critères sélectionnés
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {releveSessions.map((session, idx) => (
                        <div key={idx} className="card">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              {session[0].clientName && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {session[0].clientName}
                                  </span>
                                  {session[0].siteName && (
                                    <span className="ml-2 text-sm text-gray-600">
                                      {session[0].siteName}
                                    </span>
                                  )}
                                </div>
                              )}
                              <h3 className="text-lg font-semibold text-gray-900">
                                Session de {session.length} armoire{session.length > 1 ? 's' : ''}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Signé le {new Date(session[0].signedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/releves/session/${session[0].sessionId}/signature`)}
                              className="btn-primary flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Voir le rapport</span>
                            </button>
                          </div>
                          <div className="space-y-2">
                            {session.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-t">
                                <div>
                                  <p className="font-medium">{item.releve.armoire?.nom_armoire}</p>
                                  <p className="text-sm text-gray-600">{item.releve.armoire?.zone}</p>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {item.releve.armoire?.volume}m³
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {releveSingles.map((item, idx) => (
                        <div key={idx} className="card">
                          <div className="flex items-center justify-between">
                            <div>
                              {item.clientName && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {item.clientName}
                                  </span>
                                  {item.siteName && (
                                    <span className="ml-2 text-sm text-gray-600">
                                      {item.siteName}
                                    </span>
                                  )}
                                </div>
                              )}
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.releve.armoire?.nom_armoire}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {item.releve.armoire?.zone} - {item.releve.armoire?.volume}m³
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Signé le {new Date(item.signedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/releves/${item.releve.id}/signature`)}
                              className="btn-primary flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Voir le rapport</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'installations' && (
                <>
                  {installationGroups.length === 0 ? (
                    <div className="card text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune installation signée
                      </h3>
                      <p className="text-gray-600">
                        Aucune installation signée trouvée pour les critères sélectionnés
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {installationGroups.map((group, idx) => (
                        <div key={idx} className="card">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              {group[0].clientName && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {group[0].clientName}
                                  </span>
                                  {group[0].siteName && (
                                    <span className="ml-2 text-sm text-gray-600">
                                      {group[0].siteName}
                                    </span>
                                  )}
                                </div>
                              )}
                              <h3 className="text-lg font-semibold text-gray-900">
                                Installation de {group.length} armoire{group.length > 1 ? 's' : ''}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Signé le {new Date(group[0].signedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/installation/${group[0].siteId}/signature`)}
                              className="btn-primary flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Voir le rapport</span>
                            </button>
                          </div>
                          <div className="space-y-2">
                            {group.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-t">
                                <div className="flex-1">
                                  <p className="font-medium">{item.installation.armoire?.nom_armoire}</p>
                                  {editingInstallationId === item.installation.id ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="date"
                                        value={editingDate}
                                        onChange={(e) => setEditingDate(e.target.value)}
                                        className="input text-sm py-1 px-2"
                                        disabled={savingDate}
                                      />
                                      <button
                                        onClick={() => handleSaveDate(item.installation.id, item.siteId)}
                                        disabled={savingDate}
                                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                        title="Enregistrer"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleCancelEditDate}
                                        disabled={savingDate}
                                        className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
                                        title="Annuler"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-sm text-gray-600">
                                        {new Date(item.installation.date_installation).toLocaleDateString('fr-FR')}
                                      </p>
                                      <button
                                        onClick={() => handleStartEditDate(item.installation.id, item.installation.date_installation)}
                                        className="p-1 text-blue-600 hover:text-blue-700"
                                        title="Modifier la date"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {item.installation.nb_cellules} cellules
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'verifications' && (
                <>
                  {filteredVerifications.length === 0 ? (
                    <div className="card text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune vérification
                      </h3>
                      <p className="text-gray-600">
                        Aucune vérification trouvée pour les critères sélectionnés
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredVerifications.map((verif) => (
                        <div key={verif.id} className="card">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {verif.clientName && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {verif.clientName}
                                  </span>
                                  {verif.siteName && (
                                    <span className="ml-2 text-sm text-gray-600">
                                      {verif.siteName}
                                    </span>
                                  )}
                                </div>
                              )}
                              <h3 className="text-lg font-semibold text-gray-900">
                                {verif.armoireName || 'Vérification'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(verif.date_verification).toLocaleDateString('fr-FR')}
                              </p>
                              {verif.commentaire && (
                                <p className="text-sm text-gray-500 mt-1">{verif.commentaire}</p>
                              )}
                            </div>
                            <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800">
                              {verif.statut}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
      </div>

      {showDateUpdateDialog && pendingDateUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-600" />
              Modifier la date d'installation
            </h3>

            <p className="text-gray-700 mb-6">
              Ce rapport contient plusieurs installations. Voulez-vous modifier la date pour :
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <p className="font-medium text-gray-900">Cette installation uniquement</p>
                <p className="text-sm text-gray-600">
                  Seule l'installation sélectionnée sera mise à jour
                </p>
              </div>
              <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <p className="font-medium text-gray-900">Tout le rapport</p>
                <p className="text-sm text-gray-600">
                  Toutes les installations de ce rapport auront la même date
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDateUpdateDialog(false);
                  setPendingDateUpdate(null);
                  setEditingInstallationId(null);
                  setEditingDate('');
                }}
                disabled={savingDate}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => updateSingleInstallationDate(pendingDateUpdate.installationId)}
                disabled={savingDate}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                {savingDate ? 'Mise à jour...' : 'Cette installation'}
              </button>
              <button
                onClick={() => updateAllInstallationsDate(pendingDateUpdate.siteId)}
                disabled={savingDate}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {savingDate ? 'Mise à jour...' : 'Tout le rapport'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
