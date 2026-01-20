import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Package, FileCheck, ChevronDown, ChevronUp, Edit2, Eye, Filter, LayoutGrid, List, X, Mail, MessageCircle, Download, Plus } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { releveService } from '@/services/releve.service';
import { signatureService } from '@/services/signature.service';
import { armoiresService } from '@/services/armoires.service';
import SignatureCanvas from '@/components/SignatureCanvas';
import { useAuth } from '@/hooks/useAuth';
import type {
  ReleveEtudeComplete,
  ReleveSysteme,
  RelevePhoto,
  ModeleSysteme,
  SignatureReleve,
  Armoire,
} from '@/types/database.types';

type StatusFilter = 'all' | 'en_cours' | 'valide' | 'signe';
type ViewMode = 'simplified' | 'detailed';

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
  signature?: SignatureReleve | null;
}

interface GroupedReleves {
  date: string;
  sessionId?: string;
  releves: ReleveWithDetails[];
}

export default function ReleveListPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { user } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [groupedReleves, setGroupedReleves] = useState<GroupedReleves[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedReleve, setExpandedReleve] = useState<string | null>(null);
  const [expandedArmoire, setExpandedArmoire] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('simplified');
  const [loading, setLoading] = useState(false);
  const [signingGroup, setSigningGroup] = useState(false);
  const [selectedReleveForDetail, setSelectedReleveForDetail] = useState<ReleveWithDetails | null>(null);
  const [selectedArmoireData, setSelectedArmoireData] = useState<Armoire | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);

  const selectedClientData = clients?.find((c) => c.id === selectedClient);
  const sites = selectedClientData?.sites || [];
  const isMultiSite = selectedClientData?.multi_site ?? false;

  const effectiveSiteId = isMultiSite ? selectedSite : sites[0]?.id || '';
  const canProceed = selectedClient && effectiveSiteId;

  useEffect(() => {
    const loadReleves = async () => {
      if (!effectiveSiteId) {
        setGroupedReleves([]);
        return;
      }

      setLoading(true);
      try {
        const allReleves = await releveService.getBySiteId(effectiveSiteId);

        const relevesWithDetails = await Promise.all(
          allReleves.map(async (releve) => {
            const systemes = releve.releve_systemes || [];
            const photos = releve.releve_photos || [];
            const firstPhoto = photos.sort((a, b) => a.position - b.position)[0];

            let signature = await signatureService.getByReleveId(releve.id);

            if (!signature && releve.session_id) {
              signature = await signatureService.getBySessionId(releve.session_id);
            }

            return {
              ...releve,
              systemes,
              firstPhoto,
              signature,
            };
          })
        );

        const grouped = relevesWithDetails.reduce((acc, releve) => {
          const dateKey = new Date(releve.date_releve).toLocaleDateString('fr-FR');

          if (releve.session_id) {
            const existing = acc.find((g) => g.sessionId === releve.session_id);
            if (existing) {
              existing.releves.push(releve);
            } else {
              acc.push({ date: dateKey, sessionId: releve.session_id, releves: [releve] });
            }
          } else {
            acc.push({ date: dateKey, sessionId: undefined, releves: [releve] });
          }

          return acc;
        }, [] as GroupedReleves[]);

        grouped.sort((a, b) => {
          const dateA = new Date(a.releves[0].date_releve);
          const dateB = new Date(b.releves[0].date_releve);
          return dateB.getTime() - dateA.getTime();
        });

        setGroupedReleves(grouped);
      } catch (error) {
        console.error('Erreur lors du chargement des relevés:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReleves();
  }, [effectiveSiteId]);

  const getFilteredReleves = () => {
    return groupedReleves
      .map(group => {
        const filteredReleves = group.releves.filter(releve => {
          if (statusFilter === 'all') return true;
          if (statusFilter === 'en_cours') return releve.statut === 'brouillon';
          if (statusFilter === 'valide') return releve.statut === 'completée' && !releve.signature;
          if (statusFilter === 'signe') return releve.statut === 'completée' && !!releve.signature;
          return true;
        });
        return { ...group, releves: filteredReleves };
      })
      .filter(group => group.releves.length > 0);
  };

  const toggleDate = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const toggleReleve = (releveId: string) => {
    setExpandedReleve(expandedReleve === releveId ? null : releveId);
    setExpandedArmoire(null);
  };

  const toggleArmoire = (armoireId: string) => {
    setExpandedArmoire(expandedArmoire === armoireId ? null : armoireId);
  };

  const getStatusBadge = (releve: ReleveWithDetails) => {
    if (releve.signature) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Signé
        </span>
      );
    }
    if (releve.statut === 'completée') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Validé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        En cours
      </span>
    );
  };

  const handleViewReleve = async (releve: ReleveWithDetails) => {
    setLoading(true);
    try {
      const armoireData = await armoiresService.getById(releve.armoire_id);
      setSelectedArmoireData(armoireData);
      setSelectedReleveForDetail(releve);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      alert('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedReleveForDetail(null);
    setSelectedArmoireData(null);
    setShowSignatureCanvas(false);
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (!selectedReleveForDetail || !user) return;

    try {
      const newSignature = await signatureService.create(
        selectedReleveForDetail.id,
        signatureData,
        user.id
      );

      setSelectedReleveForDetail({
        ...selectedReleveForDetail,
        signature: newSignature,
      });

      setShowSignatureCanvas(false);

      const releves = await releveService.getBySiteId(effectiveSiteId);
      const relevesWithDetails = await Promise.all(
        releves.map(async (releve) => {
          const systemes = releve.releve_systemes || [];
          const photos = releve.releve_photos || [];
          const firstPhoto = photos.sort((a, b) => a.position - b.position)[0];
          let signature = await signatureService.getByReleveId(releve.id);
          if (!signature && releve.session_id) {
            signature = await signatureService.getBySessionId(releve.session_id);
          }
          return { ...releve, systemes, firstPhoto, signature };
        })
      );

      const grouped = relevesWithDetails.reduce((acc, releve) => {
        const dateKey = new Date(releve.date_releve).toLocaleDateString('fr-FR');
        if (releve.session_id) {
          const existing = acc.find((g) => g.sessionId === releve.session_id);
          if (existing) {
            existing.releves.push(releve);
          } else {
            acc.push({ date: dateKey, sessionId: releve.session_id, releves: [releve] });
          }
        } else {
          acc.push({ date: dateKey, sessionId: undefined, releves: [releve] });
        }
        return acc;
      }, [] as GroupedReleves[]);

      grouped.sort((a, b) => {
        const dateA = new Date(a.releves[0].date_releve);
        const dateB = new Date(b.releves[0].date_releve);
        return dateB.getTime() - dateA.getTime();
      });

      setGroupedReleves(grouped);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleSignGroup = async (group: GroupedReleves) => {
    if (group.releves.length === 0) return;
    setSigningGroup(true);
    try {
      const firstReleve = group.releves[0];
      if (firstReleve.session_id) {
        navigate(`/releves/session/${firstReleve.session_id}/signature`);
      } else if (group.releves.length === 1) {
        await handleViewReleve(firstReleve);
        setSigningGroup(false);
      } else {
        const releveIds = group.releves.map((r) => r.id);
        const sessionId = await releveService.createSessionFromReleves(releveIds);
        navigate(`/releves/session/${sessionId}/signature`);
      }
    } catch (error) {
      console.error('Erreur lors de la préparation de la signature:', error);
      alert('Erreur lors de la préparation de la signature');
      setSigningGroup(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!documentRef.current) return null;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      let page = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        page++;
        position = -(pdfHeight * page);
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedReleveForDetail || !selectedArmoireData) return;

    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) {
      alert('Erreur lors de la génération du PDF');
      return;
    }

    const fileName = `releve-${selectedArmoireData.nom_armoire}-${new Date().toLocaleDateString('fr-FR')}.pdf`;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredReleves = getFilteredReleves();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Liste des Relevés d'Étude</h2>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedSite('');
                setExpandedDate(null);
                setExpandedReleve(null);
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
                  setExpandedDate(null);
                  setExpandedReleve(null);
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

        <div className="border-t pt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <label className="label mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrer par statut
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setStatusFilter('en_cours')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'en_cours'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  En cours
                </button>
                <button
                  onClick={() => setStatusFilter('valide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'valide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Validé
                </button>
                <button
                  onClick={() => setStatusFilter('signe')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'signe'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Signé
                </button>
              </div>
            </div>

            <div>
              <label className="label mb-2">Mode d'affichage</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('simplified')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'simplified'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Simplifié
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    viewMode === 'detailed'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Détaillé
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {canProceed && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/releve-etude')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer un nouveau relevé
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Chargement des relevés...</p>
        </div>
      )}

      {!loading && canProceed && filteredReleves.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'Aucun relevé d\'étude trouvé pour ce client'
              : 'Aucun relevé trouvé pour ce filtre'}
          </p>
        </div>
      )}

      {!loading && filteredReleves.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {filteredReleves.reduce((sum, group) => sum + group.releves.length, 0)} relevé
            {filteredReleves.reduce((sum, group) => sum + group.releves.length, 0) > 1 ? 's' : ''} trouvé
            {filteredReleves.reduce((sum, group) => sum + group.releves.length, 0) > 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            {filteredReleves.map((group) => {
              const hasSignature = group.releves.some(r => r.signature);

              return (
                <div key={group.date} className="card">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <button
                      onClick={() => toggleDate(group.date)}
                      className="flex-1 flex items-center justify-between text-left hover:bg-gray-50 transition-colors p-4 -m-4 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-primary-600" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Relevé du {group.date}</h3>
                          <p className="text-sm text-gray-600">
                            {group.releves.length} armoire{group.releves.length > 1 ? 's' : ''} relevée
                            {group.releves.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {expandedDate === group.date ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    {group.releves.length > 1 && (
                      <button
                        onClick={() => handleSignGroup(group)}
                        disabled={signingGroup}
                        className={`btn flex items-center gap-2 ${
                          hasSignature ? 'btn-secondary' : 'btn-primary'
                        } disabled:opacity-50`}
                      >
                        <FileCheck className="w-5 h-5" />
                        {hasSignature ? 'Voir le rapport' : 'Signer tout'}
                      </button>
                    )}
                  </div>

                {expandedDate === group.date && (
                  <div className="mt-6 pt-6 border-t space-y-3">
                    {group.releves.map((releve) => {
                      const volume = releve.armoire?.hauteur && releve.armoire?.longueur && releve.armoire?.profondeur
                        ? (releve.armoire.hauteur * releve.armoire.longueur * releve.armoire.profondeur).toFixed(2)
                        : releve.armoire?.volume?.toString() || '-';

                      const systemeSummary = releve.systemes.length > 0
                        ? releve.systemes.map((s) => {
                            const modelLabel = MODELES.find((m) => m.value === s.modele)?.label || s.modele;
                            return `${modelLabel}m³ (x${s.quantite})`;
                          }).join(', ')
                        : 'Aucun système';

                      const isReleveExpanded = expandedReleve === releve.id;

                      return (
                        <div
                          key={releve.id}
                          className="border rounded-lg bg-white overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => toggleReleve(releve.id)}
                                className="flex-shrink-0 w-20 h-20 hover:opacity-80 transition-opacity"
                              >
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
                              </button>

                              <button
                                onClick={() => toggleReleve(releve.id)}
                                className="flex-1 min-w-0 text-left hover:bg-gray-50 transition-colors p-2 rounded"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {releve.armoire?.nom_armoire || 'Armoire sans nom'}
                                  </h4>
                                  {getStatusBadge(releve)}
                                </div>
                                {releve.armoire?.zone && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    Zone: {releve.armoire.zone}
                                  </p>
                                )}
                                {viewMode === 'simplified' && (
                                  <>
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
                                  </>
                                )}
                              </button>

                              <div className="flex-shrink-0 flex items-center gap-2">
                                {!releve.signature && (
                                  <button
                                    onClick={() => navigate(`/releves/${releve.id}`)}
                                    className="btn-secondary flex items-center gap-2"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewReleve(releve)}
                                  className={`btn flex items-center gap-2 ${
                                    releve.signature ? 'btn-secondary' : 'btn-primary'
                                  }`}
                                >
                                  {releve.signature ? <Eye className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                                  {releve.signature ? 'Voir' : 'Signer'}
                                </button>
                                <button
                                  onClick={() => toggleReleve(releve.id)}
                                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {isReleveExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {isReleveExpanded && viewMode === 'detailed' && (
                            <div className="px-4 pb-4 border-t bg-gray-50">
                              <div className="py-4">
                                <h5 className="font-semibold text-gray-900 mb-3">Détails de l'armoire</h5>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-gray-500">Longueur</p>
                                    <p className="font-medium text-gray-900">{releve.armoire?.longueur || '-'} m</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Hauteur</p>
                                    <p className="font-medium text-gray-900">{releve.armoire?.hauteur || '-'} m</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Profondeur</p>
                                    <p className="font-medium text-gray-900">{releve.armoire?.profondeur || '-'} m</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Volume</p>
                                    <p className="font-bold text-primary-600">{volume} m³</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-gray-500">Cellules</p>
                                    <p className="font-medium text-gray-900">{releve.armoire?.nb_cellules || '-'}</p>
                                  </div>
                                  {releve.armoire?.ventilation && (
                                    <div>
                                      <p className="text-xs text-gray-500">Ventilations</p>
                                      <p className="font-medium text-gray-900">{releve.armoire?.nb_ventilations || '-'}</p>
                                    </div>
                                  )}
                                  {releve.armoire?.arrivee_cables && (
                                    <div>
                                      <p className="text-xs text-gray-500">Arrivée câbles</p>
                                      <p className="font-medium text-gray-900">{releve.armoire.arrivee_cables}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="border-t pt-4">
                                  <h5 className="font-semibold text-gray-900 mb-3">Systèmes installés</h5>
                                  {releve.systemes.length > 0 ? (
                                    <div className="space-y-2">
                                      {releve.systemes.map((systeme, idx) => {
                                        const modelLabel = MODELES.find((m) => m.value === systeme.modele)?.label || systeme.modele;
                                        const details = [];
                                        if (systeme.tube) details.push('Tube');
                                        if (systeme.pressostat) details.push(`Pressostat ${systeme.pressostat_type}`);
                                        if (systeme.tete_sprinkler) details.push(`Têtes: ${systeme.tete_sprinkler_quantite} (${systeme.tete_sprinkler_temperature}°)`);
                                        if (systeme.sirene_flash) details.push('Sirène/Flash');

                                        return (
                                          <div key={idx} className="bg-white rounded-lg p-3 border">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="font-medium text-gray-900">
                                                  Modèle {modelLabel}m³
                                                  <span className="ml-2 text-sm text-gray-600">
                                                    (Quantité: {systeme.quantite})
                                                  </span>
                                                </p>
                                                {details.length > 0 && (
                                                  <p className="text-sm text-gray-600 mt-1">
                                                    {details.join(' • ')}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm">Aucun système configuré</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedReleveForDetail && selectedArmoireData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Relevé d'Étude - {selectedArmoireData.nom_armoire}
                  </h3>
                  <button
                    onClick={handleCloseDetail}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div ref={documentRef} className="space-y-6 bg-white p-6">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {selectedArmoireData.nom_armoire}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(selectedReleveForDetail.date_releve).toLocaleDateString('fr-FR')}
                        </p>
                        {selectedArmoireData.zone && (
                          <p className="text-sm text-gray-600">Zone: {selectedArmoireData.zone}</p>
                        )}
                      </div>
                      <div>{getStatusBadge(selectedReleveForDetail)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Longueur</p>
                      <p className="font-medium text-gray-900">{selectedArmoireData.longueur || '-'} m</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hauteur</p>
                      <p className="font-medium text-gray-900">{selectedArmoireData.hauteur || '-'} m</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profondeur</p>
                      <p className="font-medium text-gray-900">{selectedArmoireData.profondeur || '-'} m</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Volume</p>
                      <p className="font-bold text-primary-600">
                        {selectedArmoireData.hauteur && selectedArmoireData.longueur && selectedArmoireData.profondeur
                          ? (selectedArmoireData.hauteur * selectedArmoireData.longueur * selectedArmoireData.profondeur).toFixed(2)
                          : selectedArmoireData.volume?.toString() || '-'}{' '}
                        m³
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Cellules</p>
                      <p className="font-medium text-gray-900">{selectedArmoireData.nb_cellules || '-'}</p>
                    </div>
                    {selectedArmoireData.ventilation && (
                      <div>
                        <p className="text-xs text-gray-500">Ventilations</p>
                        <p className="font-medium text-gray-900">{selectedArmoireData.nb_ventilations || '-'}</p>
                      </div>
                    )}
                    {selectedArmoireData.arrivee_cables && (
                      <div>
                        <p className="text-xs text-gray-500">Arrivée câbles</p>
                        <p className="font-medium text-gray-900">{selectedArmoireData.arrivee_cables}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Systèmes installés</h5>
                    {selectedReleveForDetail.systemes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedReleveForDetail.systemes.map((systeme, idx) => {
                          const modelLabel = MODELES.find((m) => m.value === systeme.modele)?.label || systeme.modele;
                          const details = [];
                          if (systeme.tube) details.push('Tube');
                          if (systeme.pressostat) details.push(`Pressostat ${systeme.pressostat_type}`);
                          if (systeme.tete_sprinkler)
                            details.push(`Têtes: ${systeme.tete_sprinkler_quantite} (${systeme.tete_sprinkler_temperature}°)`);
                          if (systeme.sirene_flash) details.push('Sirène/Flash');

                          return (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    Modèle {modelLabel}m³
                                    <span className="ml-2 text-sm text-gray-600">(Quantité: {systeme.quantite})</span>
                                  </p>
                                  {details.length > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">{details.join(' • ')}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Aucun système configuré</p>
                    )}
                  </div>

                  {selectedReleveForDetail.releve_photos && selectedReleveForDetail.releve_photos.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Photos</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedReleveForDetail.releve_photos
                          .sort((a, b) => a.position - b.position)
                          .map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.url_photo}
                              alt={`Photo ${photo.position}`}
                              crossOrigin="anonymous"
                              className="w-full h-48 object-cover rounded-lg border"
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {selectedReleveForDetail.signature && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Signature</h5>
                      <img
                        src={selectedReleveForDetail.signature.signature_data}
                        alt="Signature"
                        className="border rounded-lg p-2 bg-white max-w-md"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Signé le {new Date(selectedReleveForDetail.signature.created_at).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(selectedReleveForDetail.signature.created_at).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} className="btn-secondary flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      PDF
                    </button>
                  </div>
                  {!selectedReleveForDetail.signature ? (
                    <button
                      onClick={() => setShowSignatureCanvas(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FileCheck className="w-5 h-5" />
                      Signer
                    </button>
                  ) : (
                    <button onClick={handleCloseDetail} className="btn-primary">
                      Fermer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={handleSaveSignature}
          onCancel={() => setShowSignatureCanvas(false)}
        />
      )}
    </div>
  );
}
