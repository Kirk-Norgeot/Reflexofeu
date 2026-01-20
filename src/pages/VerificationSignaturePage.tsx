import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCheck, Loader2 } from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import { verificationService, verificationSystemeService, verificationPhotoService } from '@/services/verification.service';
import { verificationSignatureService } from '@/services/signature.service';
import { armoiresService } from '@/services/armoires.service';
import { useAuth } from '@/hooks/useAuth';
import type {
  VerificationComplete,
  VerificationSysteme,
  VerificationPhoto,
  SignatureVerification,
} from '@/types/database.types';

interface VerificationWithDetails {
  verification: VerificationComplete;
  systemes: VerificationSysteme[];
  photos: VerificationPhoto[];
}

export default function VerificationSignaturePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [verifications, setVerifications] = useState<VerificationWithDetails[]>([]);
  const [signature, setSignature] = useState<SignatureVerification | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedBy, setSignedBy] = useState('');
  const [client, setClient] = useState<any>(null);
  const [site, setSite] = useState<any>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  useEffect(() => {
    const loadSiteAndClient = async () => {
      const firstArmoire = verifications[0]?.verification.armoire;
      if (!firstArmoire) return;

      try {
        const armoireDetails = await armoiresService.getById(firstArmoire.id);
        if (armoireDetails?.site) {
          setSite(armoireDetails.site);
          if ((armoireDetails.site as any).client) {
            setClient((armoireDetails.site as any).client);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations:', error);
      }
    };

    if (verifications.length > 0) {
      loadSiteAndClient();
    }
  }, [verifications]);

  const loadSessionData = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const sessionVerifications = await verificationService.getBySessionId(sessionId);

      if (sessionVerifications.length === 0) {
        navigate('/verification');
        return;
      }

      const verificationsWithDetails: VerificationWithDetails[] = [];

      for (const verification of sessionVerifications) {
        const systemes = await verificationSystemeService.getByVerificationId(verification.id);
        const photos = await verificationPhotoService.getByVerificationId(verification.id);

        verificationsWithDetails.push({
          verification,
          systemes,
          photos: photos.sort((a, b) => a.position - b.position),
        });
      }

      setVerifications(verificationsWithDetails);

      const signatureData = await verificationSignatureService.getBySessionId(sessionId);
      setSignature(signatureData);
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (signatureData: string) => {
    if (!sessionId || !signedBy.trim()) {
      alert('Veuillez indiquer le nom du signataire');
      return;
    }

    try {
      const newSignature = await verificationSignatureService.create(sessionId, signatureData, signedBy);
      setSignature(newSignature);
      setShowSignatureCanvas(false);
      alert('Signature enregistrée avec succès');
      navigate('/verification');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la signature:', error);
      alert('Erreur lors de la sauvegarde de la signature');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (showSignatureCanvas) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Signature de la vérification</h2>

          <div className="mb-4">
            <label className="label">Nom du signataire *</label>
            <input
              type="text"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              className="input"
              placeholder="Nom et prénom"
            />
          </div>

          <SignatureCanvas
            onSave={handleSaveSignature}
            onCancel={() => setShowSignatureCanvas(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Rapport de Vérification - {client?.nom}
        </h1>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Informations Client</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Client</p>
            <p className="font-medium">{client?.nom}</p>
          </div>
          {client?.multi_site && (
            <div>
              <p className="text-sm text-gray-600">Site</p>
              <p className="font-medium">{site?.nom_site}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Date de vérification</p>
            <p className="font-medium">
              {new Date(verifications[0]?.verification.date_verification).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nombre d'armoires vérifiées</p>
            <p className="font-medium">{verifications.length}</p>
          </div>
        </div>
      </div>

      {verifications.map(({ verification, systemes, photos }, index) => (
        <div key={verification.id} className="card">
          <h3 className="text-lg font-semibold mb-4">
            Armoire {index + 1}: {verification.armoire?.nom_armoire}
          </h3>

          {verification.commentaire && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-800 mb-1">Commentaire</p>
              <p className="text-sm text-blue-900">{verification.commentaire}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-3">Systèmes installés</h4>
            {systemes.map((systeme, idx) => (
              <div key={systeme.id} className="border rounded-lg p-4 mb-3 bg-gray-50">
                <h5 className="font-medium mb-2">Système {idx + 1}</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Modèle:</span>
                    <span className="ml-2 font-medium">{systeme.modele}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantité:</span>
                    <span className="ml-2 font-medium">{systeme.quantite}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tube:</span>
                    <span className="ml-2 font-medium">{systeme.tube ? 'Oui' : 'Non'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pressostat:</span>
                    <span className="ml-2 font-medium">
                      {systeme.pressostat ? `Oui (${systeme.pressostat_type})` : 'Non'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tête Sprinkler:</span>
                    <span className="ml-2 font-medium">
                      {systeme.tete_sprinkler
                        ? `${systeme.tete_sprinkler_quantite}x ${systeme.tete_sprinkler_temperature}°C`
                        : 'Non'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sirène/Flash:</span>
                    <span className="ml-2 font-medium">{systeme.sirene_flash ? 'Oui' : 'Non'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Panneau:</span>
                    <span className="ml-2 font-medium">{systeme.panneau ? 'Oui' : 'Non'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact NF Suppl.:</span>
                    <span className="ml-2 font-medium">{systeme.contact_nf_suppl ? 'Oui' : 'Non'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h6 className="font-medium text-sm mb-2">Contrôles effectués</h6>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Pression:</span>
                      <span className={`ml-2 font-medium ${systeme.pression_ok ? 'text-green-600' : 'text-red-600'}`}>
                        {systeme.pression_ok ? 'OK' : 'NOK'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">État du tube:</span>
                      <span className={`ml-2 font-medium ${systeme.etat_tube === 'Bon' ? 'text-green-600' : 'text-orange-600'}`}>
                        {systeme.etat_tube}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tête sprinkler:</span>
                      <span className={`ml-2 font-medium ${systeme.tete_sprinkler_ok ? 'text-green-600' : 'text-red-600'}`}>
                        {systeme.tete_sprinkler_ok ? 'OK' : 'NOK'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sirène flash:</span>
                      <span className={`ml-2 font-medium ${systeme.sirene_flash_ok ? 'text-green-600' : 'text-red-600'}`}>
                        {systeme.sirene_flash_ok ? 'OK' : 'NOK'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Batterie changée:</span>
                      <span className={`ml-2 font-medium ${systeme.batterie_changee ? 'text-green-600' : 'text-red-600'}`}>
                        {systeme.batterie_changee ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    {systeme.etat_environnement && systeme.etat_environnement.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Environnement:</span>
                        <span className="ml-2 font-medium text-orange-600">
                          {systeme.etat_environnement.join(', ')}
                          {systeme.etat_environnement.includes('Autre') && systeme.etat_environnement_autre && (
                            <span className="ml-1">({systeme.etat_environnement_autre})</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {photos.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-3">Photos ({photos.length})</h4>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, idx) => (
                  <img
                    key={photo.id}
                    src={photo.url_photo}
                    alt={`Photo ${idx + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-32 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {signature ? (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileCheck className="w-6 h-6 text-green-600 mr-2" />
            Signature validée
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Signé par</p>
              <p className="font-medium">{signature.signed_by}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Signature</p>
              <img
                src={signature.signature_data}
                alt="Signature"
                className="border rounded max-w-md h-32 object-contain bg-white"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de signature</p>
              <p className="font-medium">{new Date(signature.created_at).toLocaleString('fr-FR')}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={() => navigate('/verification')} className="btn-primary">
              Retour aux vérifications
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Signature du client</h3>
          <p className="text-gray-600 mb-4">
            Le client doit signer ce rapport de vérification pour valider les travaux effectués.
          </p>
          <button onClick={() => setShowSignatureCanvas(true)} className="btn-primary">
            Signer le rapport
          </button>
        </div>
      )}
    </div>
  );
}
