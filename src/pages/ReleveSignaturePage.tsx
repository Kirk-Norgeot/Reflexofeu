import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, Download, FileCheck, Loader2, Edit, FileText, FileCode } from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import { releveService, releveSystemeService, relevePhotoService } from '@/services/releve.service';
import { signatureService } from '@/services/signature.service';
import { armoiresService } from '@/services/armoires.service';
import { useAuth } from '@/hooks/useAuth';
import { ExportService, type ExportFormat } from '@/services/export.service';
import type {
  ReleveEtudeComplete,
  ReleveSysteme,
  RelevePhoto,
  ModeleSysteme,
  SignatureReleve,
  Armoire,
} from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];

export default function ReleveSignaturePage() {
  const { releveId } = useParams<{ releveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);

  const [releve, setReleve] = useState<ReleveEtudeComplete | null>(null);
  const [armoire, setArmoire] = useState<Armoire | null>(null);
  const [systemes, setSystemes] = useState<ReleveSysteme[]>([]);
  const [photos, setPhotos] = useState<RelevePhoto[]>([]);
  const [signature, setSignature] = useState<SignatureReleve | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReleveData();
  }, [releveId]);

  const loadReleveData = async () => {
    if (!releveId) return;

    setLoading(true);
    try {
      const releveData = await releveService.getById(releveId);
      if (!releveData) {
        navigate('/releves-liste');
        return;
      }

      setReleve(releveData);

      if (releveData.armoire_id) {
        const armoireData = await armoiresService.getById(releveData.armoire_id);
        setArmoire(armoireData);
      }

      const systemesData = await releveSystemeService.getByReleveId(releveId);
      setSystemes(systemesData);

      const photosData = await relevePhotoService.getByReleveId(releveId);
      setPhotos(photosData.sort((a, b) => a.position - b.position));

      const signatureData = await signatureService.getByReleveId(releveId);
      setSignature(signatureData);
    } catch (error) {
      console.error('Erreur lors du chargement du relevé:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (!releveId || !user) return;

    try {
      const newSignature = await signatureService.create(releveId, signatureData, user.id);
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

  const handleShareEmail = async () => {
    if (!releve || !armoire) return;

    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) {
      alert('Erreur lors de la génération du PDF');
      return;
    }

    const fileName = `releve-${armoire.nom_armoire}-${new Date().toLocaleDateString('fr-FR')}.pdf`;

    if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Relevé d'étude - ${armoire.nom_armoire}`,
          text: `Relevé d'étude pour l'armoire ${armoire.nom_armoire}. Date du relevé: ${new Date(releve.date_releve).toLocaleDateString('fr-FR')}`,
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
        const subject = encodeURIComponent(`Relevé d'étude - ${armoire.nom_armoire}`);
        const body = encodeURIComponent(
          `Bonjour,\n\nVeuillez trouver ci-joint le relevé d'étude pour l'armoire ${armoire.nom_armoire}.\n\nDate du relevé: ${new Date(releve.date_releve).toLocaleDateString('fr-FR')}\n\nCordialement\n\nNote: Le fichier PDF a été téléchargé. Veuillez l'attacher manuellement à cet email.`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }, 500);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!releve || !armoire) return;

    const pdfBlob = await generatePDFBlob();
    if (!pdfBlob) {
      alert('Erreur lors de la génération du PDF');
      return;
    }

    const fileName = `releve-${armoire.nom_armoire}-${new Date().toLocaleDateString('fr-FR')}.pdf`;

    if (navigator.share && navigator.canShare?.({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      try {
        await navigator.share({
          files: [file],
          title: `Relevé d'étude - ${armoire.nom_armoire}`,
          text: `Relevé d'étude pour l'armoire ${armoire.nom_armoire}. Date du relevé: ${new Date(releve.date_releve).toLocaleDateString('fr-FR')}`,
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
          `Relevé d'étude - ${armoire.nom_armoire}\nDate: ${new Date(releve.date_releve).toLocaleDateString('fr-FR')}\n\nLe document PDF a été téléchargé.`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }, 500);
    }
  };

  const handleDownload = async (format: ExportFormat = 'pdf') => {
    if (!documentRef.current || !releve || !armoire) return;

    setExporting(true);
    setShowExportMenu(false);

    try {
      let blob: Blob | null = null;
      let fileName = '';
      const baseName = `releve-${armoire.nom_armoire}-${new Date().toLocaleDateString('fr-FR')}`;

      switch (format) {
        case 'pdf':
          blob = await ExportService.exportToPDF(documentRef.current, {
            fileName: `${baseName}.pdf`,
            title: `Relevé d'étude - ${armoire.nom_armoire}`,
          });
          fileName = `${baseName}.pdf`;
          break;

        case 'html':
          blob = await ExportService.exportToHTML(documentRef.current, {
            fileName: `${baseName}.html`,
            title: `Relevé d'étude - ${armoire.nom_armoire}`,
            description: `Date: ${new Date(releve.date_releve).toLocaleDateString('fr-FR')}`,
          });
          fileName = `${baseName}.html`;
          break;

        case 'docx':
          blob = await ExportService.exportToDocx(documentRef.current, {
            fileName: `${baseName}.docx`,
            title: `Relevé d'étude - ${armoire.nom_armoire}`,
            description: `Date: ${new Date(releve.date_releve).toLocaleDateString('fr-FR')}`,
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
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!releve || !armoire) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Relevé introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Relevé d'Étude</h2>
        <div className="flex gap-3">
          {signature ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exporting}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Exportation...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Télécharger
                    </>
                  )}
                </button>

                {showExportMenu && !exporting && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                      >
                        <FileText className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium text-gray-900">PDF</div>
                          <div className="text-xs text-gray-500">Format portable (qualité améliorée)</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDownload('html')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                      >
                        <FileCode className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">HTML</div>
                          <div className="text-xs text-gray-500">Éditable dans Word (100% fidèle)</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDownload('docx')}
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
                className="btn btn-secondary flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="btn btn-secondary flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/releve-etude/${releveId}`)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Modifier le relevé
              </button>
              <button
                onClick={() => setShowSignatureCanvas(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <FileCheck className="w-5 h-5" />
                Signer le document
              </button>
            </>
          )}
        </div>
      </div>

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

        <div className="space-y-6">
          <div className="text-center border-b-2 border-orange-500 pb-4 pdf-avoid-break">
            <h3 className="text-3xl font-bold text-gray-900">RELEVÉ D'ÉTUDE</h3>
            <p className="text-gray-700 mt-2">
              Date: {new Date(releve.date_releve).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-b-2 border-orange-200 pb-4 pdf-avoid-break">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Armoire</p>
              <p className="text-lg font-bold text-gray-900">{armoire.nom_armoire}</p>
              {armoire.zone && (
                <p className="text-sm text-gray-600">Zone: {armoire.zone}</p>
              )}
            </div>
            {(armoire.hauteur || armoire.longueur || armoire.profondeur || (armoire.volume && armoire.volume > 0)) && (
              <div>
                <p className="text-sm text-gray-600 font-semibold">Dimensions</p>
                {armoire.hauteur && armoire.hauteur > 0 && (
                  <p className="text-sm">Hauteur: {armoire.hauteur} m</p>
                )}
                {armoire.longueur && armoire.longueur > 0 && (
                  <p className="text-sm">Longueur: {armoire.longueur} m</p>
                )}
                {armoire.profondeur && armoire.profondeur > 0 && (
                  <p className="text-sm">Profondeur: {armoire.profondeur} m</p>
                )}
                {armoire.volume && armoire.volume > 0 && (
                  <p className="text-sm font-semibold">Volume: {armoire.volume} m³</p>
                )}
              </div>
            )}
            {photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Photo de l'armoire</p>
                <img
                  src={photos[0].url_photo}
                  alt="Armoire"
                  crossOrigin="anonymous"
                  className="w-full h-32 object-cover rounded-lg border-2 border-orange-200"
                />
              </div>
            )}
          </div>

          <div className="border-b-2 border-orange-200 pb-4 pdf-avoid-break">
            <h4 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-orange-500 pb-2">Matériel Proposé</h4>
            {systemes.length === 0 ? (
              <p className="text-gray-500 italic">Aucun système configuré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-orange-500 text-white">
                      <th className="border border-gray-300 px-3 py-2 text-left">Cylindre</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Tube</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Pressostat</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Sprinkler</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Sirène Flash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemes.map((systeme, index) => {
                      const modeleLabel = MODELES.find((m) => m.value === systeme.modele)?.label || systeme.modele;
                      return (
                        <tr key={index} className="bg-white hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">
                            {systeme.quantite} × RV{modeleLabel}m³
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {systeme.tube ? (
                              <span className="text-green-600 font-bold text-lg">✓</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {systeme.pressostat ? (
                              <span className="text-green-600" title={systeme.pressostat_type || ''}>
                                <span className="font-bold text-lg">✓</span>
                                {systeme.pressostat_type && <span className="text-xs block">{systeme.pressostat_type}</span>}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {systeme.tete_sprinkler ? (
                              <span className="text-green-600" title={`${systeme.tete_sprinkler_quantite} têtes à ${systeme.tete_sprinkler_temperature}°C`}>
                                <span className="font-bold">{systeme.tete_sprinkler_quantite}×</span>
                                <span className="text-xs block">{systeme.tete_sprinkler_temperature}°C</span>
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {systeme.sirene_flash ? (
                              <span className="text-green-600 font-bold text-lg">✓</span>
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
            )}
          </div>

          {photos.length > 0 && (
            <div className="border-b-2 border-orange-200 pb-4 pdf-avoid-break">
              <h4 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-orange-500 pb-2">Photos</h4>
              <div className="grid grid-cols-2 gap-4">
                {photos.slice(0, 4).map((photo, index) => (
                  <img
                    key={photo.id}
                    src={photo.url_photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border-2 border-orange-200 pdf-avoid-break"
                  />
                ))}
              </div>
            </div>
          )}

          {signature && (
            <div className="pt-4 pdf-avoid-break">
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-900">
                  Bon pour offre technique et commerciale
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Signé le {new Date(signature.signed_at).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(signature.signed_at).toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div className="flex justify-center">
                <img
                  src={signature.signature_data}
                  alt="Signature"
                  className="max-w-xs border-2 border-orange-300 rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}
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
