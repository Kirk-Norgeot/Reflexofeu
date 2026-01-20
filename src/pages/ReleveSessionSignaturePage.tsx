import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileCheck, Loader2, Package, Mail, MessageCircle, FileText, FileCode } from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import { releveService, releveSystemeService, relevePhotoService } from '@/services/releve.service';
import { signatureService } from '@/services/signature.service';
import { useAuth } from '@/hooks/useAuth';
import { ExportService, type ExportFormat } from '@/services/export.service';
import type {
  ReleveEtudeComplete,
  ReleveSysteme,
  RelevePhoto,
  ModeleSysteme,
  SignatureReleve,
} from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

interface ReleveWithDetails {
  releve: ReleveEtudeComplete;
  systemes: ReleveSysteme[];
  photos: RelevePhoto[];
}

export default function ReleveSessionSignaturePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);

  const [releves, setReleves] = useState<ReleveWithDetails[]>([]);
  const [signature, setSignature] = useState<SignatureReleve | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const sessionReleves = await releveService.getBySessionId(sessionId);

      if (sessionReleves.length === 0) {
        navigate('/releves-liste');
        return;
      }

      const relevesWithDetails: ReleveWithDetails[] = [];

      for (const releve of sessionReleves) {
        const systemes = await releveSystemeService.getByReleveId(releve.id);
        const photos = await relevePhotoService.getByReleveId(releve.id);

        relevesWithDetails.push({
          releve,
          systemes,
          photos: photos.sort((a, b) => a.position - b.position),
        });
      }

      setReleves(relevesWithDetails);

      const signatureData = await signatureService.getBySessionId(sessionId);
      setSignature(signatureData);
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (!sessionId || !user) return;

    try {
      const newSignature = await signatureService.createForSession(sessionId, signatureData, user.id);
      setSignature(newSignature);
      setShowSignatureCanvas(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!documentRef.current) return null;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let currentY = margin;
      let isFirstPage = true;

      // Récupérer tous les éléments à ne pas couper
      const sections = documentRef.current.querySelectorAll('.pdf-avoid-break, .pdf-page-break');

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;

        // Forcer un saut de page si demandé
        if (section.classList.contains('pdf-page-break') && !isFirstPage) {
          pdf.addPage();
          currentY = margin;
        }

        // Capturer la section
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Vérifier si la section tient sur la page actuelle
        if (currentY + imgHeight > pdfHeight - margin && !isFirstPage) {
          pdf.addPage();
          currentY = margin;
        }

        // Ajouter l'image
        pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
        currentY += imgHeight + 2; // Petit espace entre les sections

        isFirstPage = false;
      }

      return pdf.output('blob');
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
      const baseName = `releve-etude-session-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'pdf':
          blob = await ExportService.exportToPDF(documentRef.current, {
            fileName: `${baseName}.pdf`,
            title: `Relevé d'étude - Session`,
          });
          fileName = `${baseName}.pdf`;
          break;

        case 'html':
          blob = await ExportService.exportToHTML(documentRef.current, {
            fileName: `${baseName}.html`,
            title: `Relevé d'étude - Session`,
            description: `${releves.length} armoire${releves.length > 1 ? 's' : ''}`,
          });
          fileName = `${baseName}.html`;
          break;

        case 'docx':
          blob = await ExportService.exportToDocx(documentRef.current, {
            fileName: `${baseName}.docx`,
            title: `Relevé d'étude - Session`,
            description: `${releves.length} armoire${releves.length > 1 ? 's' : ''}`,
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

    const fileName = `releve-etude-${new Date().toISOString().split('T')[0]}.pdf`;

    if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Relevé d'étude - Session`,
          text: `Relevé d'étude pour ${releves.length} armoire${releves.length > 1 ? 's' : ''}`,
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
        const subject = encodeURIComponent(`Relevé d'étude - Session`);
        const body = encodeURIComponent(
          `Bonjour,\n\nVeuillez trouver ci-joint le relevé d'étude pour ${releves.length} armoire${releves.length > 1 ? 's' : ''}.\n\nCordialement\n\nNote: Le fichier PDF a été téléchargé. Veuillez l'attacher manuellement à cet email.`
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

    const fileName = `releve-etude-${new Date().toISOString().split('T')[0]}.pdf`;

    if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Relevé d'étude - Session`,
          text: `Relevé d'étude pour ${releves.length} armoire${releves.length > 1 ? 's' : ''}`,
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
          `Relevé d'étude - Session\n${releves.length} armoire${releves.length > 1 ? 's' : ''}\n\nLe document PDF a été téléchargé.`
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

  if (releves.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Rapport de Relevé</h2>
        <div className="card">
          <p className="text-gray-500">Aucune donnée trouvée pour cette session.</p>
          <button
            onClick={() => navigate('/releves-liste')}
            className="btn-secondary mt-4"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const firstReleve = releves[0].releve;
  const dateReleve = firstReleve.date_releve;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Rapport de Relevé</h2>

      <div ref={documentRef} className="card bg-white">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .pdf-avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .pdf-page-break {
              page-break-before: always;
            }
          }
        `}} />

        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-6 py-5 -mx-6 -mt-6 mb-8 pdf-avoid-break">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-orange-600 font-bold text-3xl">R</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">ReflexOFeu</h1>
                <p className="text-sm text-orange-100">Systèmes d'Extinction FK-5-1-12</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b-2 border-orange-500 pb-4 mb-6 pdf-avoid-break">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            RAPPORT DE RELEVÉ D'ÉTUDE
          </h1>
          <p className="text-center text-gray-700">
            Date: {new Date(dateReleve).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-center text-gray-700">
            Nombre d'armoires: {releves.length}
          </p>
        </div>

        <div className="space-y-8">
          {releves.map((item, index) => {
            const { releve, systemes, photos } = item;
            const armoire = releve.armoire;
            const firstPhoto = photos[0];

            return (
              <div key={releve.id} className="border-b-2 border-orange-200 pb-6 last:border-b-0 pdf-avoid-break">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-24 h-24">
                    {firstPhoto ? (
                      <img
                        src={firstPhoto.url_photo}
                        alt="Relevé"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover rounded border-2 border-orange-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-50 rounded border-2 border-orange-200 flex items-center justify-center">
                        <Package className="w-10 h-10 text-orange-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {index + 1}. {armoire?.nom_armoire || 'Armoire'}
                    </h3>
                    {armoire?.zone && (
                      <p className="text-sm text-gray-600 mb-2">Zone: {armoire.zone}</p>
                    )}

                    <div className="space-y-1 text-sm">
                      {armoire && (armoire.longueur || armoire.hauteur || armoire.profondeur || (armoire.volume && armoire.volume > 0)) && (
                        <div className="flex gap-4">
                          {armoire.longueur && armoire.longueur > 0 && (
                            <span className="text-gray-700">L: {armoire.longueur}m</span>
                          )}
                          {armoire.hauteur && armoire.hauteur > 0 && (
                            <span className="text-gray-700">H: {armoire.hauteur}m</span>
                          )}
                          {armoire.profondeur && armoire.profondeur > 0 && (
                            <span className="text-gray-700">P: {armoire.profondeur}m</span>
                          )}
                          {armoire.volume && armoire.volume > 0 && (
                            <span className="font-medium text-gray-900">V: {armoire.volume}m³</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Systèmes préconisés:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-orange-500 text-white">
                          <th className="border border-gray-300 px-2 py-1 text-left">Cylindre</th>
                          <th className="border border-gray-300 px-2 py-1 text-center">Tube</th>
                          <th className="border border-gray-300 px-2 py-1 text-center">Presso.</th>
                          <th className="border border-gray-300 px-2 py-1 text-center">Sprinkler</th>
                          <th className="border border-gray-300 px-2 py-1 text-center">Sirène</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemes.map((systeme, idx) => {
                          const modeleLabel = MODELES.find(m => m.value === systeme.modele)?.label || '?';
                          return (
                            <tr key={idx} className="bg-white hover:bg-gray-50">
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {photos.length > 1 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Photos supplémentaires ({photos.length - 1})
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {photos.slice(1).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo.url_photo}
                          alt={`Photo ${idx + 2}`}
                          crossOrigin="anonymous"
                          className="w-full h-20 object-cover rounded border border-orange-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {signature && (
          <div className="mt-8 pt-6 border-t-2 border-orange-500 pdf-avoid-break">
            <h3 className="font-semibold text-gray-900 mb-4">Signature</h3>
            <img
              src={signature.signature_data}
              alt="Signature"
              className="h-32 border-2 border-orange-300 rounded shadow-sm"
            />
            <p className="text-sm text-gray-700 mt-2">
              Signé le {new Date(signature.signed_at).toLocaleString('fr-FR')}
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {!signature ? (
            <button
              onClick={() => setShowSignatureCanvas(true)}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <FileCheck className="w-5 h-5" />
              <span>Signer le rapport</span>
            </button>
          ) : (
            <>
              <div className="relative flex-1">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={generating}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
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
            onClick={() => navigate('/releves-liste')}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>
      </div>

      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={handleSaveSignature}
          onCancel={() => setShowSignatureCanvas(false)}
        />
      )}
    </div>
  );
}
