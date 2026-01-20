import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Check, ArrowLeft, Upload } from 'lucide-react';
import { installationService, installationPhotoService } from '@/services/installation.service';
import { armoiresService } from '@/services/armoires.service';
import { uploadPhotoToStorage } from '@/utils/storage';
import CameraCapture from '@/components/CameraCapture';
import type { Installation, Armoire, InstallationPhoto } from '@/types/database.types';

interface InstallationWithDetails {
  installation: Installation;
  armoire: Armoire | null;
  photos: InstallationPhoto[];
}

export default function InstallationPhotosPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [installations, setInstallations] = useState<InstallationWithDetails[]>([]);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadInstallationsData();
  }, [siteId]);

  const loadInstallationsData = async () => {
    if (!siteId) return;

    setLoading(true);
    try {
      const armoires = await armoiresService.getBySiteId(siteId);
      const installationsData: InstallationWithDetails[] = [];

      for (const armoire of armoires) {
        const armoireInstallations = await installationService.getByArmoireId(armoire.id);

        if (armoireInstallations && armoireInstallations.length > 0) {
          for (const installation of armoireInstallations) {
            if (installation.statut === 'fait') {
              const photos = await installationPhotoService.getByInstallationId(installation.id);

              installationsData.push({
                installation,
                armoire,
                photos: photos.sort((a, b) => a.position - b.position),
              });
            }
          }
        }
      }

      setInstallations(installationsData);
    } catch (error) {
      console.error('Erreur lors du chargement des installations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = async (photoDataUrl: string) => {
    if (installations.length === 0) return;

    try {
      const blob = await fetch(photoDataUrl).then((res) => res.blob());
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const photoUrl = await uploadPhotoToStorage(file, 'installation-photos');

      if (!photoUrl) {
        alert('Erreur lors de la sauvegarde de la photo');
        return;
      }

      const firstInstallation = installations[0];
      const position = firstInstallation.photos.length + 1;

      await installationPhotoService.create({
        installation_id: firstInstallation.installation.id,
        url_photo: photoUrl,
        position,
      });

      await loadInstallationsData();
      setCapturingPhoto(false);
    } catch (error) {
      console.error('Erreur lors de la capture photo:', error);
      alert('Erreur lors de la sauvegarde de la photo');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || installations.length === 0) return;

    setUploading(true);

    try {
      const firstInstallation = installations[0];
      let currentPosition = firstInstallation.photos.length;

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const photoUrl = await uploadPhotoToStorage(file, 'installation-photos');

        if (photoUrl) {
          currentPosition += 1;

          await installationPhotoService.create({
            installation_id: firstInstallation.installation.id,
            url_photo: photoUrl,
            position: currentPosition,
          });
        }
      }

      await loadInstallationsData();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement des photos:', error);
      alert('Erreur lors du téléchargement des photos');
    } finally {
      setUploading(false);
    }
  };

  const totalPhotos = installations.reduce((sum, item) => sum + item.photos.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/installation/${siteId}/signature`)}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h2 className="text-3xl font-bold text-gray-900">Photos après installation sur site</h2>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Annexe au rapport d'installation
        </h3>
        <p className="text-gray-700 mb-4">
          Ajoutez des photos complémentaires qui seront intégrées au rapport d'installation.
          Ces photos seront affichées en fin de rapport (maximum 8 par page A4).
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-5 h-5 text-green-600" />
          <span>{installations.length} installation{installations.length > 1 ? 's' : ''} complétée{installations.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-5 h-5 text-green-600" />
          <span>{totalPhotos} photo{totalPhotos > 1 ? 's' : ''} ajoutée{totalPhotos > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Galerie de photos</h3>

        {installations.length > 0 && installations[0].photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {installations[0].photos.map((photo, photoIdx) => (
              <div key={photo.id} className="bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                <img
                  src={photo.url_photo}
                  alt={`Photo ${photoIdx + 1}`}
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain rounded"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucune photo ajoutée</p>
        )}

        <div className="mt-6 pt-6 border-t">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCapturingPhoto(true)}
              disabled={uploading}
              className="btn-primary flex items-center space-x-2 justify-center disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              <span>Prendre une photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary flex items-center space-x-2 justify-center disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Envoi en cours...' : 'Sélectionner des photos'}</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Les photos seront ajoutées en annexe du rapport d'installation
          </p>
        </div>
      </div>

      {capturingPhoto && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setCapturingPhoto(false)}
        />
      )}
    </div>
  );
}
