import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileCheck, Loader2, Package, Mail, MessageCircle, User, Camera, FileText, FileCode } from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import { installationService, installationSystemeService, installationPhotoService } from '@/services/installation.service';
import { installationSignatureService } from '@/services/signature.service';
import { armoiresService } from '@/services/armoires.service';
import { sitesService, clientsService } from '@/services/clients.service';
import { useAuth } from '@/hooks/useAuth';
import { ExportService, type ExportFormat } from '@/services/export.service';
import type {
  Installation,
  InstallationSysteme,
  InstallationPhoto,
  ModeleSysteme,
  SignatureInstallation,
  Armoire,
  Site,
  Client,
} from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

interface InstallationWithDetails {
  installation: Installation;
  armoire: Armoire | null;
  systemes: InstallationSysteme[];
  photos: InstallationPhoto[];
}

export default function InstallationSignaturePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);

  const [installations, setInstallations] = useState<InstallationWithDetails[]>([]);
  const [signature, setSignature] = useState<SignatureInstallation | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [siteData, setSiteData] = useState<Site | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadInstallationsData();
  }, [siteId]);

  const loadInstallationsData = async () => {
    if (!siteId) return;

    setLoading(true);
    try {
      const site = await sitesService.getById(siteId);
      setSiteData(site);

      if (site?.client_id) {
        const client = await clientsService.getById(site.client_id);
        setClientData(client);
      }

      const armoires = await armoiresService.getBySiteId(siteId);
      const installationsData: InstallationWithDetails[] = [];

      for (const armoire of armoires) {
        const armoireInstallations = await installationService.getByArmoireId(armoire.id);

        if (armoireInstallations && armoireInstallations.length > 0) {
          for (const installation of armoireInstallations) {
            if (installation.statut === 'fait') {
              const systemes = await installationSystemeService.getByInstallationId(installation.id);
              const photos = await installationPhotoService.getByInstallationId(installation.id);

              installationsData.push({
                installation,
                armoire,
                systemes,
                photos: photos.sort((a, b) => a.position - b.position),
              });
            }
          }
        }
      }

      setInstallations(installationsData);

      const signatureData = await installationSignatureService.getBySiteId(siteId);
      setSignature(signatureData);
    } catch (error) {
      console.error('Erreur lors du chargement des installations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (!siteId) return;

    try {
      const newSignature = await installationSignatureService.create(siteId, signatureData, signerName || undefined);
      setSignature(newSignature);
      setShowSignatureCanvas(false);
      setShowSignatureDialog(false);
      setSignerName('');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleRequestSignature = () => {
    setShowSignatureDialog(true);
  };

  const handleProceedToSignature = () => {
    if (!signerName.trim()) {
      alert('Veuillez entrer le nom de la personne qui signe');
      return;
    }
    setShowSignatureDialog(false);
    setShowSignatureCanvas(true);
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!documentRef.current) return null;

    try {
      return await ExportService.exportToPDF(documentRef.current, {
        fileName: `rapport-installation-${new Date().toISOString().split('T')[0]}.pdf`,
        title: `Rapport d'installation`,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return null;
    }
  };

  const handleDownloadPDF = async (format: ExportFormat = 'pdf') => {
    if (!documentRef.current) return;

    setGenerating(true);
    setShowExportMenu(false);

    try {
      let blob: Blob | null = null;
      let fileName = '';
      const baseName = `rapport-installation-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'pdf':
          blob = await ExportService.exportToPDF(documentRef.current, {
            fileName: `${baseName}.pdf`,
            title: `Rapport d'installation`,
          });
          fileName = `${baseName}.pdf`;
          break;

        case 'html':
          blob = await ExportService.exportToHTML(documentRef.current, {
            fileName: `${baseName}.html`,
            title: `Rapport d'installation`,
            description: `${installations.length} armoire${installations.length > 1 ? 's' : ''}`,
          });
          fileName = `${baseName}.html`;
          break;

        case 'docx':
          blob = await ExportService.exportToDocx(documentRef.current, {
            fileName: `${baseName}.docx`,
            title: `Rapport d'installation`,
            description: `${installations.length} armoire${installations.length > 1 ? 's' : ''}`,
          });
          fileName = `${baseName}.docx`;
          break;
      }

      if (!blob) {
        alert('Erreur lors de la génération du document');
        return;
      }

      await ExportService.downloadFile(blob, fileName);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export du document');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareEmail = async () => {
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) {
      alert('Erreur lors de la génération du PDF');
      return;
    }

    const fileName = `rapport-installation-${new Date().toISOString().split('T')[0]}.pdf`;

    if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Rapport d'installation`,
          text: `Rapport d'installation pour ${installations.length} armoire${installations.length > 1 ? 's' : ''}`,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
        }
      }
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        const subject = encodeURIComponent(`Rapport d'installation`);
        const body = encodeURIComponent(
          `Bonjour,\n\nVeuillez trouver ci-joint le rapport d'installation pour ${installations.length} armoire${installations.length > 1 ? 's' : ''}.\n\nCordialement\n\nNote: Le fichier PDF a été téléchargé. Veuillez l'attacher manuellement à cet email.`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }, 500);
    }
  };

  const handleShareWhatsApp = async () => {
    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) {
      alert('Erreur lors de la génération du PDF');
      return;
    }

    const fileName = `rapport-installation-${new Date().toISOString().split('T')[0]}.pdf`;

    if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Rapport d'installation`,
          text: `Rapport d'installation pour ${installations.length} armoire${installations.length > 1 ? 's' : ''}`,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
        }
      }
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        const text = encodeURIComponent(
          `Rapport d'installation\n${installations.length} armoire${installations.length > 1 ? 's' : ''}\n\nLe document PDF a été téléchargé.`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (installations.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Rapport d'Installation</h2>
        <div className="card">
          <p className="text-gray-500">Aucune installation complétée trouvée pour ce site.</p>
          <button
            onClick={() => navigate('/installation')}
            className="btn-secondary mt-4"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const allPhotos = installations.flatMap(i => i.photos);
  const totalPhotoPages = Math.ceil(allPhotos.length / 12);
  const totalPages = 3 + totalPhotoPages;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Rapport d'Installation</h2>

      <div ref={documentRef} className="space-y-6">
        <style dangerouslySetInnerHTML={{__html: `
          .pdf-page {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            position: relative;
          }
          @media screen {
            .pdf-page {
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
          }
          @media print {
            .pdf-page {
              page-break-after: always;
              margin: 0;
              box-shadow: none;
            }
            .pdf-avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        `}} />

        {/* PAGE 1: Points 1-7 */}
        <div className="card bg-white overflow-hidden p-4 pdf-page">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-4 py-3 -mx-4 -mt-4 mb-4 pdf-avoid-break">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-orange-600 font-bold text-2xl">R</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-0.5">ReflexOFeu</h1>
                  <p className="text-xs text-orange-100">Systèmes d'Extinction FK-5-1-12</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-3 pdf-avoid-break">
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">Rapport d'Installation</h2>
            <p className="text-sm text-gray-700 mb-0.5">Détection Extinction Incendie</p>
            <p className="text-xs text-gray-600">Protection professionnelle pour armoires électriques</p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4 mb-3 bg-gray-50 py-2 pdf-avoid-break">
            <h3 className="text-base font-bold text-slate-800 mb-1.5">Descriptifs des installations :</h3>
            <p className="text-sm font-semibold text-slate-700 mb-1.5">Système de détection extinction automatique modulaire</p>

            {clientData && (
              <>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Client:</span> {clientData.nom}
                </p>
                {clientData.contact && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Contact:</span> {clientData.contact}
                  </p>
                )}
                {siteData && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Site:</span> {siteData.nom}
                  </p>
                )}
                {siteData && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Adresse:</span> {siteData.adresse}, {siteData.code_postal} {siteData.ville}
                  </p>
                )}
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Date de l'installation:</span> {
                    installations.length > 0 && installations[0].installation.date_installation
                      ? new Date(installations[0].installation.date_installation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  }
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="pdf-avoid-break">
              <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">1. Demande formulée de protection :</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Armoire de commande</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">TGBT</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Armoire condensateur</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Machine usinage CNC</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Stockage</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Divers</span>
                </div>
              </div>
            </div>

            <div className="pdf-avoid-break">
              <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">2. Éléments fournis pour l'étude :</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Plans</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Dimensions</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Descriptions</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Photos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="pdf-avoid-break">
              <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">3. Agent extincteur :</h4>
              <div className="flex items-start gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                  <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-slate-700 leading-[1.4]">FK-5-1-12</span>
              </div>
            </div>

            <div className="pdf-avoid-break">
              <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">4. Classe de Feu :</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 flex-1 leading-[1.4]">Classe A : Matériaux solides avec formation de braises</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 flex-1 leading-[1.4]">Classe B : Feux de liquides - Feux d'origine électrique</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                  </svg>
                  <span className="text-slate-700 flex-1 leading-[1.4]">Classe C : Feux de gaz</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3 pdf-avoid-break">
            <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">5. Report d'activation :</h4>
            <p className="text-xs text-slate-700 mb-2">
              Tous les systèmes Reflexofeu sont équipés de pressostats afin de pouvoir activer la
              coupure d'énergie sur les armoires électriques, moteurs... Le client se doit de vérifier la
              possibilité de relayer cette information.
            </p>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">Besoins complémentaires client :</p>
            <div className="space-y-1 text-xs">
              {installations.some(i => i.systemes.some(s => s.pressostat && s.pressostat_type === 'NO')) && (
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Pressostat NO</span>
                </div>
              )}
              {installations.some(i => i.systemes.some(s => s.contact_nf_suppl)) && (
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Pressostat supp. NF</span>
                </div>
              )}
              <div className="flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="10" height="10" fill="white" stroke="#475569" strokeWidth="2"/>
                </svg>
                <span className="text-slate-700 leading-[1.4]">Centrale technique</span>
              </div>
            </div>
          </div>

          <div className="pdf-avoid-break">
            <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">7. Principe d'extinction installé :</h4>
            <p className="text-xs text-slate-700 mb-2">
              Système de détection et extinction précoce sur armoire électrique. Double détection installée :
            </p>
            <div className="pl-3 mb-2 text-xs text-slate-700">
              <p>- Tête à déclenchement thermique à 68°C</p>
              <p>- Tube de détection extinction installé au plus près des composants</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                  <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-slate-700 leading-[1.4]">FK-5-1-12 Agent extincteur</span>
              </div>
              <div className="flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                  <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-slate-700 leading-[1.4]">Détection au plus près des composants</span>
              </div>
              <div className="flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                  <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-slate-700 leading-[1.4]">Détection via module de détection thermique 68°C</span>
              </div>
              {installations.some(i => i.systemes.some(s => s.sirene_flash)) && (
                <div className="flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[0.15rem]" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="10" height="10" fill="#475569" stroke="#475569" strokeWidth="2"/>
                    <path d="M 4 7 L 6 9 L 10 5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-slate-700 leading-[1.4]">Sirène flash reliée au contact sec</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-200 text-right">
            <p className="text-xs text-gray-500">1/{totalPages}</p>
          </div>
        </div>

        {/* PAGE 2: Points 8-9-10 */}
        <div className="card bg-white overflow-hidden p-4 pdf-page">
          <div className="pdf-avoid-break">
            <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">8. Matériel proposé :</h4>
            <p className="text-xs text-slate-700 mb-2">
              Système de détection extinction modulaire Reflexofeu avec tête sprinkler et quantité
              d'agent nécessaire en fonction du volume de chaque armoire et des ventilations en
              présences. L'ensemble du système est couvert par le certificat CE n°19/FR/4225-0-REV0
              du 03/06/2019, délivré par l'organisme notifié CE 0029 APRAGAZ.
            </p>

            <div className="mb-4"></div>

            <div className="bg-orange-50 p-2 rounded border border-orange-200 mb-2">
              <h5 className="font-semibold text-gray-800 text-xs mb-1.5">Composants :</h5>

              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <p className="font-semibold mb-0.5 text-xs">Cylindre en acier avec revêtement intérieur anti-corrosion</p>
                  <p className="text-xs text-slate-600 mb-1">(Conforme à la Directive des Equipements sous-pression 2014/68/UE)</p>
                  <div className="pl-3 space-y-0.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Pression de service : 14 bar</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Pression d'épreuve : 27 bar</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Température d'utilisation : -30°C / +60°C</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Support de fixation en acier peint</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-semibold mb-0.5 text-xs">Vanne de décharge Inox 304 usinée en France équipée de :</p>
                  <div className="pl-3 space-y-0.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Manomètre de contrôle visuel</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Valve Schraeder de pressurisation</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Connecteur avec soupape de contrôle</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Tube plongeur souple pour utilisation Horizontale et/ou Verticale</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-semibold mb-0.5 text-xs">Tube capillaire de détection extinction :</p>
                  <div className="pl-3 space-y-0.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Résistance à une température ambiante de : 140°C</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Pression de service : 14 bar</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Rupture au contact de la flamme ou à : 200°C</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Fixation par support adhésif vissable et/ou par collier serre-cables</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Presse étoupe IP64</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Embout de fin de ligne à griffe</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-semibold mb-0.5 text-xs">Pressostat :</p>
                  <div className="pl-3 space-y-0.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Certifié CE</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">IP54</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Normalement ouvert quand le système est en veille</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Contact sec fermé au déclenchement du système</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Autre version sur demande</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-semibold mb-0.5 text-xs">Agent extincteur et propulseur :</p>
                  <div className="pl-3 space-y-0.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">FK-5-1-12</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Azote N2</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-700 mt-[0.15rem]">•</span>
                      <span className="text-slate-700 leading-[1.4]">Quantité définie en fonction de la configuration de l'espace à protéger</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3 pdf-avoid-break">
            <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">9. Maintenance :</h4>
            <p className="text-xs text-slate-700 mb-1.5">
              Tous les 6 mois, veuillez à vous assurer que les systèmes Reflexofeu sont en bon état
              extérieur. Indicateur visuel en zone verte.
            </p>
            <p className="text-xs text-slate-700">
              Tous les ans, une vérification est faite par l'installateur de chaque système.
            </p>
          </div>

          <div className="pdf-avoid-break">
            <h4 className="font-bold text-gray-800 text-sm mb-1.5 border-b-2 border-orange-500 pb-0.5">10. Durée de vie et garantie matériel :</h4>
            <div className="pl-3 text-xs text-slate-700 space-y-0.5">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-700 mt-[0.15rem]">•</span>
                <span className="text-slate-700 leading-[1.4]">10 ans de validité pour le système</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-700 mt-[0.15rem]">•</span>
                <span className="text-slate-700 leading-[1.4]">1 an de garantie fabricant</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-200 text-right">
            <p className="text-xs text-gray-500">2/{totalPages}</p>
          </div>
        </div>

        {/* PAGE 3: Liste des équipements et signature */}
        <div className="card bg-white overflow-hidden p-4 pdf-page">
          <div className="border-t-2 border-orange-500 pt-3 mb-3 pdf-avoid-break">
            <h3 className="text-base font-bold text-gray-900 mb-2">Liste des équipements protégés :</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-orange-500 text-white">
                    <th className="border border-gray-300 px-2 py-1 text-left">Armoire</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Cylindres</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Tube</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Presso.</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Sprinkler</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Sirène</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Panneau</th>
                    <th className="border border-gray-300 px-2 py-1 text-center">Contact NF</th>
                  </tr>
                </thead>
                <tbody>
                  {installations.map((item, index) => {
                    const { installation, armoire, systemes } = item;
                    return systemes.map((systeme, idx) => {
                      const modeleLabel = MODELES.find(m => m.value === systeme.modele)?.label || '?';
                      const isFirstRow = idx === 0;
                      return (
                        <tr key={`${installation.id}-${idx}`} className="bg-white hover:bg-gray-50">
                          {isFirstRow && (
                            <td
                              className="border border-gray-300 px-2 py-2 text-slate-900 font-semibold align-top"
                              rowSpan={systemes.length}
                            >
                              {armoire?.nom_armoire || `Armoire ${index + 1}`}
                            </td>
                          )}
                          <td className="border border-gray-300 px-2 py-1 text-slate-700">
                            {systeme.quantite} × RV{modeleLabel}m³
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {systeme.tube ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {systeme.pressostat ? (
                              <span className="text-green-600 font-bold" title={systeme.pressostat_type || ''}>✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {systeme.tete_sprinkler ? (
                              <span className="text-green-600 text-xs" title={`${systeme.tete_sprinkler_quantite} têtes à ${systeme.tete_sprinkler_temperature}°C`}>
                                {systeme.tete_sprinkler_quantite}×
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {systeme.sirene_flash ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {systeme.panneau ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {systeme.contact_nf_suppl ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {signature && (
            <div className="mt-3 pt-2 border-t border-orange-500 pdf-avoid-break">
              <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Signature Client :</h3>
              {signature.signed_by && (
                <p className="text-xs text-gray-700 mb-1.5">
                  <span className="font-semibold">Nom du signataire:</span> {signature.signed_by}
                </p>
              )}
              <div className="bg-white rounded p-1.5 inline-block border border-orange-300">
                <img
                  src={signature.signature_data}
                  alt="Signature"
                  className="h-6 w-auto"
                />
              </div>
              <p className="text-xs text-gray-700 mt-1.5 font-medium">
                Signé le {new Date(signature.signed_at).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          )}

          <div className="border-t-2 border-orange-500 pt-3 mt-6 pdf-avoid-break">
            <div className="text-center mb-3">
              <p className="text-xs text-gray-700 mb-1">REFLEXOFEU - SASU au capital de 3000.00 € - L'érable 28250 Digny - France</p>
              <p className="text-xs text-gray-700 mb-1">Siret : 84870209800015 - TVA : FR60848702098</p>
              <p className="text-xs text-gray-700">
                <span className="text-orange-600 font-medium">www.reflexofeu.fr</span> / <span className="text-orange-600 font-medium">contact@reflexofeu.fr</span>
              </p>
            </div>

            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  Reflex<span className="text-orange-600">O</span>Feu
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-orange-200 text-center pdf-avoid-break">
            <p className="text-xs text-gray-600">© 2024 Reflexofeu - Documentation Technique Système FK-5-1-12</p>
            <p className="text-xs text-gray-600">Document confidentiel - Usage réservé aux professionnels</p>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-200 text-right">
            <p className="text-xs text-gray-500">3/{totalPages}</p>
          </div>
        </div>

        {/* PAGES PHOTOS: 12 photos en portrait par page */}
        {installations.some(i => i.photos.length > 0) && (() => {
          const allPhotos = installations.flatMap(i => i.photos);
          const photoPages = [];
          for (let i = 0; i < allPhotos.length; i += 12) {
            photoPages.push(allPhotos.slice(i, i + 12));
          }

          return photoPages.map((pagePhotos, pageIdx) => (
            <div key={pageIdx} className="card bg-white p-4 pdf-page">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-orange-500 pdf-avoid-break">
                <Camera className="w-7 h-7 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">Photos d'installation</h2>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const photo = pagePhotos[idx];
                  return (
                    <div key={idx} className="pdf-avoid-break">
                      {photo ? (
                        <img
                          src={photo.url_photo}
                          alt={`Photo ${idx + 1}`}
                          crossOrigin="anonymous"
                          className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-orange-300 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg border-2 border-gray-200"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-3 border-t border-orange-200 text-center pdf-avoid-break">
                <p className="text-xs text-gray-600">© 2024 Reflexofeu - Documentation Technique Système FK-5-1-12</p>
                <p className="text-xs text-gray-600">Document confidentiel - Usage réservé aux professionnels</p>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-200 text-right">
                <p className="text-xs text-gray-500">{4 + pageIdx}/{totalPages}</p>
              </div>
            </div>
          ));
        })()}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {!signature ? (
            <button
              onClick={handleRequestSignature}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <FileCheck className="w-5 h-5" />
              <span>Signer le rapport</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/installation/${siteId}/photos`)}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Ajouter des photos</span>
              </button>
              <div className="relative flex-1">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={generating}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Exportation...</span>
                    </>
                  ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Télécharger</span>
                  </>
                )}
              </button>

              {showExportMenu && !generating && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleDownloadPDF('pdf')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    >
                      <FileText className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-900">PDF</div>
                        <div className="text-xs text-gray-500">Format portable (qualité améliorée)</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownloadPDF('html')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    >
                      <FileCode className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">HTML</div>
                        <div className="text-xs text-gray-500">Éditable dans Word (100% fidèle)</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownloadPDF('docx')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <FileText className="w-5 h-5 text-blue-800" />
                      <div>
                        <div className="font-medium text-gray-900">Word (DOCX)</div>
                        <div className="text-xs text-gray-500">Format Microsoft Word</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

              <button
                onClick={handleShareEmail}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/installation')}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>
      </div>

      {showSignatureDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6" />
              Informations du signataire
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom et prénom de la personne qui signe le rapport
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ex: Jean Dupont"
                className="input w-full"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleProceedToSignature();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                Cette personne doit être le contact client ou une personne autorisée
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignatureDialog(false);
                  setSignerName('');
                }}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleProceedToSignature}
                disabled={!signerName.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={handleSaveSignature}
          onCancel={() => {
            setShowSignatureCanvas(false);
            setShowSignatureDialog(true);
          }}
        />
      )}
    </div>
  );
}
