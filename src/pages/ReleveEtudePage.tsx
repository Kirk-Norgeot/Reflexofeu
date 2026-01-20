import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ChevronDown, ChevronUp, Camera, FileText, Calendar, Lightbulb, Package } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { armoiresService } from '@/services/armoires.service';
import { releveService, releveSystemeService, relevePhotoService } from '@/services/releve.service';
import { uploadPhotoToStorage } from '@/utils/storage';
import CameraCapture from '@/components/CameraCapture';
import NumberSelector from '@/components/NumberSelector';
import ZoneSelector from '@/components/ZoneSelector';
import NumericInput from '@/components/NumericInput';
import DepthSelector from '@/components/DepthSelector';
import { formatDate } from '@/utils/format';
import type { ModeleSysteme, TemperatureSprinkler, ArriveeCables, TypeContact, RelevePhoto, ReleveEtudeComplete, ReleveSysteme } from '@/types/database.types';

const MODELES: { value: ModeleSysteme; label: string }[] = [
  { value: 'RV0.5m3', label: '0.5' },
  { value: 'RV1m3', label: '1' },
  { value: 'RV1.5m3', label: '1.5' },
  { value: 'RV2m3', label: '2' },
  { value: 'RV2.5m3', label: '2.5' },
  { value: 'RV3m3', label: '3' },
];
const TEMPERATURES: TemperatureSprinkler[] = ['40', '57', '68', '79', '93'];

interface ReleveWithDetails extends ReleveEtudeComplete {
  systemes: ReleveSysteme[];
  firstPhoto?: RelevePhoto;
}

interface SystemeFormData {
  modele: ModeleSysteme;
  quantite: number;
  tube: boolean;
  pressostat: boolean;
  pressostat_type: TypeContact;
  pressostat_quantite: number;
  tete_sprinkler: boolean;
  tete_sprinkler_quantite: number;
  tete_sprinkler_temperature: TemperatureSprinkler;
  sirene_flash: boolean;
  sirene_flash_quantite: number;
}

interface ArmoireFormData {
  nom_armoire: string;
  zone: string;
  hauteur: string;
  longueur: string;
  profondeur: string;
  nb_cellules: string;
  ventilation: boolean;
  nb_ventilations: string;
  arrivee_cables: ArriveeCables;
  systemes: SystemeFormData[];
  photos: File[];
  expanded: boolean;
}

export default function ReleveEtudePage() {
  const { releveId } = useParams<{ releveId: string }>();
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [armoires, setArmoires] = useState<ArmoireFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [currentArmoireIndex, setCurrentArmoireIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingArmoireId, setExistingArmoireId] = useState<string | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<RelevePhoto[]>([]);
  const [siteReleves, setSiteReleves] = useState<ReleveWithDetails[]>([]);
  const [loadingReleves, setLoadingReleves] = useState(false);
  const [selectedReleveFromList, setSelectedReleveFromList] = useState<string>('');
  const [pretAsigner, setPretAsigner] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [showPreconisations, setShowPreconisations] = useState(false);
  const [currentArmoireForPreco, setCurrentArmoireForPreco] = useState<number | null>(null);
  const armoireNameRefs = useRef<(HTMLInputElement | null)[]>([]);

  const selectedClientData = clients?.find((c) => c.id === selectedClient);
  const sites = selectedClientData?.sites || [];
  const isMultiSite = selectedClientData?.multi_site ?? false;

  const effectiveSiteId = isMultiSite ? selectedSite : (sites[0]?.id || '');
  const canProceed = selectedClient && effectiveSiteId;

  useEffect(() => {
    const loadReleveData = async () => {
      if (!releveId) return;

      setLoading(true);
      try {
        const releveData = await releveService.getById(releveId);
        if (!releveData) {
          navigate('/releves-liste');
          return;
        }

        const armoireData = await armoiresService.getById(releveData.armoire_id);
        if (!armoireData) {
          navigate('/releves-liste');
          return;
        }

        setExistingArmoireId(armoireData.id);

        const systemesData = await releveSystemeService.getByReleveId(releveId);
        const photosData = await relevePhotoService.getByReleveId(releveId);
        setExistingPhotos(photosData);
        setPretAsigner(releveData.statut === 'completée');

        const armoireFormData: ArmoireFormData = {
          nom_armoire: armoireData.nom_armoire,
          zone: armoireData.zone || '',
          hauteur: armoireData.hauteur?.toString() || '',
          longueur: armoireData.longueur?.toString() || '',
          profondeur: armoireData.profondeur?.toString() || '',
          nb_cellules: armoireData.nb_cellules?.toString() || '',
          ventilation: armoireData.ventilation || false,
          nb_ventilations: armoireData.nb_ventilations?.toString() || '',
          arrivee_cables: armoireData.arrivee_cables || 'Haut',
          systemes: systemesData.map((s) => ({
            modele: s.modele,
            quantite: s.quantite,
            tube: s.tube,
            pressostat: s.pressostat,
            pressostat_type: s.pressostat_type || 'NO/NF',
            pressostat_quantite: s.pressostat_quantite || 1,
            tete_sprinkler: s.tete_sprinkler,
            tete_sprinkler_quantite: s.tete_sprinkler_quantite || 1,
            tete_sprinkler_temperature: s.tete_sprinkler_temperature || '68',
            sirene_flash: s.sirene_flash,
            sirene_flash_quantite: s.sirene_flash_quantite || 1,
          })),
          photos: [],
          expanded: true,
        };

        setArmoires([armoireFormData]);

        if (armoireData.site_id && clients) {
          const client = clients.find((c) =>
            c.sites?.some((site) => site.id === armoireData.site_id)
          );
          if (client) {
            setSelectedClient(client.id);
            if (client.multi_site) {
              setSelectedSite(armoireData.site_id);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du relevé:', error);
        alert('Erreur lors du chargement du relevé');
      } finally {
        setLoading(false);
      }
    };

    loadReleveData();
  }, [releveId, clients, navigate]);

  useEffect(() => {
    const loadSiteReleves = async () => {
      if (!effectiveSiteId || releveId) return;

      setLoadingReleves(true);
      try {
        const releves = await releveService.getBySiteId(effectiveSiteId);

        const relevesWithDetails = await Promise.all(
          releves.map(async (releve) => {
            const systemes = await releveSystemeService.getByReleveId(releve.id);
            const photos = await relevePhotoService.getByReleveId(releve.id);
            const firstPhoto = photos.sort((a, b) => a.position - b.position)[0];

            return {
              ...releve,
              systemes,
              firstPhoto,
            };
          })
        );

        setSiteReleves(relevesWithDetails);
      } catch (error) {
        console.error('Erreur lors du chargement des relevés:', error);
      } finally {
        setLoadingReleves(false);
      }
    };

    loadSiteReleves();
  }, [effectiveSiteId, releveId]);

  const handleSelectReleveFromList = async (selectedReleveId: string) => {
    if (!selectedReleveId) {
      setSelectedReleveFromList('');
      setArmoires([]);
      setExistingArmoireId(null);
      setExistingPhotos([]);
      setPretAsigner(false);
      setCreatingNew(false);
      return;
    }

    setLoading(true);
    setCreatingNew(false);
    try {
      const releveData = await releveService.getById(selectedReleveId);
      if (!releveData) return;

      const armoireData = await armoiresService.getById(releveData.armoire_id);
      if (!armoireData) return;

      setExistingArmoireId(armoireData.id);
      setSelectedReleveFromList(selectedReleveId);

      const systemesData = await releveSystemeService.getByReleveId(selectedReleveId);
      const photosData = await relevePhotoService.getByReleveId(selectedReleveId);
      setExistingPhotos(photosData);
      setPretAsigner(releveData.statut === 'completée');

      const armoireFormData: ArmoireFormData = {
        nom_armoire: armoireData.nom_armoire,
        zone: armoireData.zone || '',
        hauteur: armoireData.hauteur?.toString() || '',
        longueur: armoireData.longueur?.toString() || '',
        profondeur: armoireData.profondeur?.toString() || '',
        nb_cellules: armoireData.nb_cellules?.toString() || '',
        ventilation: armoireData.ventilation || false,
        nb_ventilations: armoireData.nb_ventilations?.toString() || '',
        arrivee_cables: armoireData.arrivee_cables || 'Haut',
        systemes: systemesData.map((s) => ({
          modele: s.modele,
          quantite: s.quantite,
          tube: s.tube,
          pressostat: s.pressostat,
          pressostat_type: s.pressostat_type || 'NO/NF',
          pressostat_quantite: s.pressostat_quantite || 1,
          tete_sprinkler: s.tete_sprinkler,
          tete_sprinkler_quantite: s.tete_sprinkler_quantite || 1,
          tete_sprinkler_temperature: s.tete_sprinkler_temperature || '68',
          sirene_flash: s.sirene_flash,
          sirene_flash_quantite: s.sirene_flash_quantite || 1,
        })),
        photos: [],
        expanded: true,
      };

      setArmoires([armoireFormData]);
    } catch (error) {
      console.error('Erreur lors du chargement du relevé:', error);
      alert('Erreur lors du chargement du relevé');
    } finally {
      setLoading(false);
    }
  };

  const calculateVolume = (hauteur: string, longueur: string, profondeur: string): string => {
    if (!hauteur || !longueur || !profondeur) return '';
    const h = parseFloat(hauteur);
    const l = parseFloat(longueur);
    const p = parseFloat(profondeur);
    if (isNaN(h) || isNaN(l) || isNaN(p)) return '';
    return (h * l * p).toFixed(2);
  };

  const addArmoire = () => {
    // Collapse all existing armoires
    const updatedArmoires = armoires.map(a => ({ ...a, expanded: false }));

    // Add new armoire with one default system
    setArmoires([
      ...updatedArmoires,
      {
        nom_armoire: '',
        zone: '',
        hauteur: '',
        longueur: '',
        profondeur: '',
        nb_cellules: '',
        ventilation: false,
        nb_ventilations: '',
        arrivee_cables: 'Haut',
        systemes: [{
          modele: 'RV1m3',
          quantite: 1,
          tube: false,
          pressostat: false,
          pressostat_type: 'NO/NF',
          pressostat_quantite: 1,
          tete_sprinkler: false,
          tete_sprinkler_quantite: 1,
          tete_sprinkler_temperature: '68',
          sirene_flash: false,
          sirene_flash_quantite: 1,
        }],
        photos: [],
        expanded: true,
      },
    ]);

    // Focus on the new armoire name input after render
    setTimeout(() => {
      const newIndex = updatedArmoires.length;
      if (armoireNameRefs.current[newIndex]) {
        armoireNameRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        armoireNameRefs.current[newIndex]?.focus();
      }
    }, 150);
  };

  const removeArmoire = (index: number) => {
    setArmoires(armoires.filter((_, i) => i !== index));
  };

  const updateArmoire = (index: number, field: string, value: any) => {
    const newArmoires = [...armoires];
    newArmoires[index] = { ...newArmoires[index], [field]: value };
    setArmoires(newArmoires);
  };

  const toggleArmoireExpanded = (index: number) => {
    const newArmoires = [...armoires];
    newArmoires[index].expanded = !newArmoires[index].expanded;
    setArmoires(newArmoires);
  };

  const addSysteme = (armoireIndex: number) => {
    const newArmoires = [...armoires];
    newArmoires[armoireIndex].systemes.push({
      modele: 'RV1m3',
      quantite: 1,
      tube: false,
      pressostat: false,
      pressostat_type: 'NO/NF',
      pressostat_quantite: 1,
      tete_sprinkler: false,
      tete_sprinkler_quantite: 1,
      tete_sprinkler_temperature: '68',
      sirene_flash: false,
      sirene_flash_quantite: 1,
    });
    setArmoires(newArmoires);
  };

  const removeSysteme = (armoireIndex: number, systemeIndex: number) => {
    const newArmoires = [...armoires];
    newArmoires[armoireIndex].systemes = newArmoires[armoireIndex].systemes.filter(
      (_, i) => i !== systemeIndex
    );
    setArmoires(newArmoires);
  };

  const updateSysteme = (armoireIndex: number, systemeIndex: number, field: string, value: any) => {
    const newArmoires = [...armoires];
    newArmoires[armoireIndex].systemes[systemeIndex] = {
      ...newArmoires[armoireIndex].systemes[systemeIndex],
      [field]: value,
    };
    setArmoires(newArmoires);
  };

  const handlePhotoChange = (armoireIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const currentPhotos = armoires[armoireIndex].photos;
      const newPhotos = Array.from(e.target.files).slice(0, 5 - currentPhotos.length);
      const newArmoires = [...armoires];
      newArmoires[armoireIndex].photos = [...currentPhotos, ...newPhotos];
      setArmoires(newArmoires);
    }
  };

  const removePhoto = (armoireIndex: number, photoIndex: number) => {
    const newArmoires = [...armoires];
    newArmoires[armoireIndex].photos = newArmoires[armoireIndex].photos.filter(
      (_, i) => i !== photoIndex
    );
    setArmoires(newArmoires);
  };

  const handleCapturePhoto = (armoireIndex: number) => {
    setCurrentArmoireIndex(armoireIndex);
    setCapturingPhoto(true);
  };

  const handlePhotoCapture = (imageData: string) => {
    if (currentArmoireIndex === null) return;

    fetch(imageData)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newArmoires = [...armoires];
        newArmoires[currentArmoireIndex].photos = [...newArmoires[currentArmoireIndex].photos, file];
        setArmoires(newArmoires);
        setCapturingPhoto(false);
        setCurrentArmoireIndex(null);
      })
      .catch((error) => {
        console.error('Erreur lors de la conversion de la photo:', error);
        alert('Erreur lors de la sauvegarde de la photo');
        setCapturingPhoto(false);
        setCurrentArmoireIndex(null);
      });
  };

  const handleCancelCapture = () => {
    setCapturingPhoto(false);
    setCurrentArmoireIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveSiteId) {
      alert('Veuillez sélectionner un site');
      return;
    }

    if (armoires.length === 0) {
      alert('Veuillez ajouter au moins une armoire');
      return;
    }

    for (const armoire of armoires) {
      if (!armoire.nom_armoire) {
        alert('Veuillez renseigner le nom de toutes les armoires');
        return;
      }
    }

    try {
      setSaving(true);

      const currentReleveId = releveId || selectedReleveFromList;

      if (currentReleveId && existingArmoireId) {
        // Update the first armoire (the existing one)
        const armoire = armoires[0];

        const armoireData = {
          nom_armoire: armoire.nom_armoire,
          zone: armoire.zone || undefined,
          hauteur: armoire.hauteur ? Number(armoire.hauteur) : undefined,
          longueur: armoire.longueur ? Number(armoire.longueur) : undefined,
          profondeur: armoire.profondeur ? Number(armoire.profondeur) : undefined,
          volume: undefined,
          nb_cellules: armoire.nb_cellules ? Number(armoire.nb_cellules) : undefined,
          ventilation: armoire.ventilation,
          nb_ventilations: armoire.nb_ventilations ? Number(armoire.nb_ventilations) : undefined,
          arrivee_cables: armoire.arrivee_cables,
        };

        await armoiresService.update(existingArmoireId, armoireData);

        await releveService.update(currentReleveId, {
          statut: pretAsigner ? 'completée' : 'brouillon',
        });

        const existingSystemes = await releveSystemeService.getByReleveId(currentReleveId);
        for (const sys of existingSystemes) {
          await releveSystemeService.delete(sys.id);
        }

        for (const systeme of armoire.systemes) {
          await releveSystemeService.create({
            releve_etude_id: currentReleveId,
            modele: systeme.modele,
            quantite: systeme.quantite,
            tube: systeme.tube,
            pressostat: systeme.pressostat,
            pressostat_type: systeme.pressostat ? systeme.pressostat_type : undefined,
            pressostat_quantite: systeme.pressostat ? systeme.pressostat_quantite : undefined,
            tete_sprinkler: systeme.tete_sprinkler,
            tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
            tete_sprinkler_temperature: systeme.tete_sprinkler
              ? systeme.tete_sprinkler_temperature
              : undefined,
            sirene_flash: systeme.sirene_flash,
            sirene_flash_quantite: systeme.sirene_flash ? systeme.sirene_flash_quantite : undefined,
          });
        }

        if (armoire.photos.length > 0) {
          const currentPosition = existingPhotos.length;
          for (let i = 0; i < armoire.photos.length; i++) {
            const photoUrl = await uploadPhotoToStorage(armoire.photos[i], 'releve-photos');
            if (photoUrl) {
              await relevePhotoService.create({
                releve_etude_id: currentReleveId,
                url_photo: photoUrl,
                position: currentPosition + i + 1,
              });
            }
          }
        }

        // Create new releves for additional armoires
        for (let i = 1; i < armoires.length; i++) {
          const newArmoire = armoires[i];

          const newArmoireData = {
            site_id: effectiveSiteId,
            nom_armoire: newArmoire.nom_armoire,
            zone: newArmoire.zone || undefined,
            hauteur: newArmoire.hauteur ? Number(newArmoire.hauteur) : undefined,
            longueur: newArmoire.longueur ? Number(newArmoire.longueur) : undefined,
            profondeur: newArmoire.profondeur ? Number(newArmoire.profondeur) : undefined,
            volume: undefined,
            nb_cellules: newArmoire.nb_cellules ? Number(newArmoire.nb_cellules) : undefined,
            ventilation: newArmoire.ventilation,
            nb_ventilations: newArmoire.nb_ventilations ? Number(newArmoire.nb_ventilations) : undefined,
            arrivee_cables: newArmoire.arrivee_cables,
          };

          const createdArmoire = await armoiresService.create(newArmoireData);

          const releveData = {
            armoire_id: createdArmoire.id,
            date_releve: new Date().toISOString().split('T')[0],
            statut: 'brouillon' as const,
          };

          const createdReleve = await releveService.create(releveData);

          for (const systeme of newArmoire.systemes) {
            await releveSystemeService.create({
              releve_etude_id: createdReleve.id,
              modele: systeme.modele,
              quantite: systeme.quantite,
              tube: systeme.tube,
              pressostat: systeme.pressostat,
              pressostat_type: systeme.pressostat ? systeme.pressostat_type : undefined,
              pressostat_quantite: systeme.pressostat ? systeme.pressostat_quantite : undefined,
              tete_sprinkler: systeme.tete_sprinkler,
              tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
              tete_sprinkler_temperature: systeme.tete_sprinkler
                ? systeme.tete_sprinkler_temperature
                : undefined,
              sirene_flash: systeme.sirene_flash,
              sirene_flash_quantite: systeme.sirene_flash ? systeme.sirene_flash_quantite : undefined,
            });
          }

          for (let j = 0; j < newArmoire.photos.length; j++) {
            const photoUrl = await uploadPhotoToStorage(newArmoire.photos[j], 'releve-photos');
            if (photoUrl) {
              await relevePhotoService.create({
                releve_etude_id: createdReleve.id,
                url_photo: photoUrl,
                position: j + 1,
              });
            }
          }
        }

        const totalCount = armoires.length;
        const message = totalCount > 1
          ? `Relevé modifié et ${totalCount - 1} nouvelle(s) armoire(s) ajoutée(s) avec succès !`
          : 'Relevé modifié avec succès !';

        alert(message);

        if (pretAsigner && armoires.length === 1) {
          navigate(`/releves/${currentReleveId}/signature`);
        } else {
          setSelectedReleveFromList('');
          setArmoires([]);
          setExistingArmoireId(null);
          setExistingPhotos([]);
          setPretAsigner(false);
          const releves = await releveService.getBySiteId(effectiveSiteId);

          const relevesWithDetails = await Promise.all(
            releves.map(async (releve) => {
              const systemes = await releveSystemeService.getByReleveId(releve.id);
              const photos = await relevePhotoService.getByReleveId(releve.id);
              const firstPhoto = photos.sort((a, b) => a.position - b.position)[0];

              return {
                ...releve,
                systemes,
                firstPhoto,
              };
            })
          );

          setSiteReleves(relevesWithDetails);
        }
      } else {
        const sessionId = crypto.randomUUID();
        const currentDate = new Date().toISOString().split('T')[0];

        for (const armoire of armoires) {
          const armoireData = {
            site_id: effectiveSiteId,
            nom_armoire: armoire.nom_armoire,
            zone: armoire.zone || undefined,
            hauteur: armoire.hauteur ? Number(armoire.hauteur) : undefined,
            longueur: armoire.longueur ? Number(armoire.longueur) : undefined,
            profondeur: armoire.profondeur ? Number(armoire.profondeur) : undefined,
            volume: undefined,
            nb_cellules: armoire.nb_cellules ? Number(armoire.nb_cellules) : undefined,
            ventilation: armoire.ventilation,
            nb_ventilations: armoire.nb_ventilations ? Number(armoire.nb_ventilations) : undefined,
            arrivee_cables: armoire.arrivee_cables,
          };

          const createdArmoire = await armoiresService.create(armoireData);

          const releveData = {
            armoire_id: createdArmoire.id,
            session_id: armoires.length > 1 ? sessionId : undefined,
            date_releve: currentDate,
            statut: pretAsigner ? ('completée' as const) : ('brouillon' as const),
          };

          const createdReleve = await releveService.create(releveData);

          for (const systeme of armoire.systemes) {
            await releveSystemeService.create({
              releve_etude_id: createdReleve.id,
              modele: systeme.modele,
              quantite: systeme.quantite,
              tube: systeme.tube,
              pressostat: systeme.pressostat,
              pressostat_type: systeme.pressostat ? systeme.pressostat_type : undefined,
              pressostat_quantite: systeme.pressostat ? systeme.pressostat_quantite : undefined,
              tete_sprinkler: systeme.tete_sprinkler,
              tete_sprinkler_quantite: systeme.tete_sprinkler_quantite,
              tete_sprinkler_temperature: systeme.tete_sprinkler
                ? systeme.tete_sprinkler_temperature
                : undefined,
              sirene_flash: systeme.sirene_flash,
              sirene_flash_quantite: systeme.sirene_flash ? systeme.sirene_flash_quantite : undefined,
            });
          }

          for (let i = 0; i < armoire.photos.length; i++) {
            const photoUrl = await uploadPhotoToStorage(armoire.photos[i], 'releve-photos');
            if (photoUrl) {
              await relevePhotoService.create({
                releve_etude_id: createdReleve.id,
                url_photo: photoUrl,
                position: i + 1,
              });
            }
          }
        }

        alert(`${armoires.length} relevé(s) enregistré(s) avec succès !`);

        if (pretAsigner && armoires.length > 1) {
          navigate(`/releves/session/${sessionId}/signature`);
        } else {
          setArmoires([]);
          setSelectedClient('');
          setSelectedSite('');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">
        {releveId ? 'Modifier le Relevé' : 'Relevé - Étude'}
      </h2>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sélection</h3>
          {canProceed && !releveId && siteReleves.length > 0 && !creatingNew && (
            <button
              type="button"
              onClick={() => {
                setSelectedReleveFromList('');
                setArmoires([]);
                setCreatingNew(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau relevé</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedSite('');
                setSelectedReleveFromList('');
                setArmoires([]);
                setSiteReleves([]);
                setCreatingNew(false);
              }}
              className="input"
              disabled={!!releveId || !!selectedReleveFromList}
              required
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
                  setSelectedReleveFromList('');
                  setArmoires([]);
                  setSiteReleves([]);
                  setCreatingNew(false);
                }}
                className="input"
                disabled={!selectedClient || !!releveId || !!selectedReleveFromList}
                required
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
      </div>

      {canProceed && (selectedReleveFromList || !siteReleves.length || releveId || creatingNew) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {releveId || selectedReleveFromList ? 'Armoire' : 'Nouveau relevé'}
              </h3>
              {!releveId && !selectedReleveFromList && (
                <button
                  type="button"
                  onClick={addArmoire}
                  className="btn-secondary flex items-center space-x-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une armoire</span>
                </button>
              )}
            </div>

            {armoires.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune armoire ajoutée. Cliquez sur "Ajouter une armoire" pour commencer.
              </div>
            )}

            <div className="space-y-4">
              {armoires.map((armoire, armoireIndex) => (
                <div key={armoireIndex} className="border rounded-lg bg-white">
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleArmoireExpanded(armoireIndex)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {armoire.expanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <h4 className="font-medium text-gray-900">
                        {armoire.nom_armoire || `Armoire ${armoireIndex + 1}`}
                      </h4>
                    </div>
                    {!releveId && !selectedReleveFromList && (
                      <button
                        type="button"
                        onClick={() => removeArmoire(armoireIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {armoire.expanded && (
                    <div className="p-4 space-y-6">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-3">Informations Armoire</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Nom armoire *</label>
                            <input
                              type="text"
                              ref={(el) => {
                                armoireNameRefs.current[armoireIndex] = el;
                              }}
                              value={armoire.nom_armoire}
                              onChange={(e) =>
                                updateArmoire(armoireIndex, 'nom_armoire', e.target.value)
                              }
                              className="input"
                              required
                            />
                          </div>

                          <div>
                            <ZoneSelector
                              value={armoire.zone}
                              onChange={(value) => updateArmoire(armoireIndex, 'zone', value)}
                              label="Zone"
                            />
                          </div>

                          <NumericInput
                            label="Hauteur (m)"
                            value={armoire.hauteur}
                            onChange={(value) =>
                              updateArmoire(armoireIndex, 'hauteur', value)
                            }
                          />

                          <NumericInput
                            label="Longueur (m)"
                            value={armoire.longueur}
                            onChange={(value) =>
                              updateArmoire(armoireIndex, 'longueur', value)
                            }
                          />

                          <DepthSelector
                            label="Profondeur (m)"
                            value={armoire.profondeur}
                            onChange={(value) =>
                              updateArmoire(armoireIndex, 'profondeur', value)
                            }
                          />

                          <div>
                            <NumberSelector
                              value={armoire.nb_cellules ? Number(armoire.nb_cellules) : 1}
                              onChange={(value) =>
                                updateArmoire(armoireIndex, 'nb_cellules', value.toString())
                              }
                              label="Nb de cellules"
                              min={1}
                              max={8}
                            />
                          </div>

                          <div>
                            <label className="label">Arrivée câbles</label>
                            <select
                              value={armoire.arrivee_cables}
                              onChange={(e) =>
                                updateArmoire(
                                  armoireIndex,
                                  'arrivee_cables',
                                  e.target.value as ArriveeCables
                                )
                              }
                              className="input"
                            >
                              <option value="Haut">Haut</option>
                              <option value="Bas">Bas</option>
                            </select>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`ventilation-${armoireIndex}`}
                              checked={armoire.ventilation}
                              onChange={(e) =>
                                updateArmoire(armoireIndex, 'ventilation', e.target.checked)
                              }
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <label
                              htmlFor={`ventilation-${armoireIndex}`}
                              className="ml-2 text-sm font-medium"
                            >
                              Ventilation
                            </label>
                          </div>

                          <div>
                            <NumberSelector
                              value={armoire.nb_ventilations ? Number(armoire.nb_ventilations) : 1}
                              onChange={(value) =>
                                updateArmoire(armoireIndex, 'nb_ventilations', value.toString())
                              }
                              label="Nb de ventilations"
                              min={1}
                              max={8}
                            />
                          </div>
                        </div>

                        {armoire.hauteur && armoire.longueur && armoire.profondeur && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Volume calculé</p>
                                <p className="text-2xl font-bold text-primary-600">
                                  {calculateVolume(armoire.hauteur, armoire.longueur, armoire.profondeur)} m³
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentArmoireForPreco(armoireIndex);
                                  setShowPreconisations(true);
                                }}
                                className="btn-secondary flex items-center space-x-2"
                              >
                                <Lightbulb className="w-5 h-5" />
                                <span>Préconisations</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-700">Choix Système</h5>
                        </div>

                        <div className="space-y-3">
                          {armoire.systemes.map((systeme, systemeIndex) => (
                            <div
                              key={systemeIndex}
                              className="p-4 border rounded-lg bg-gray-50 space-y-4"
                            >
                              <div className="flex justify-between items-start">
                                <h6 className="font-medium text-gray-900">
                                  Système {systemeIndex + 1}
                                </h6>
                                <button
                                  type="button"
                                  onClick={() => removeSysteme(armoireIndex, systemeIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="label">Modèle (m³)</label>
                                  <div className="flex flex-wrap gap-2">
                                    {MODELES.map((m) => (
                                      <button
                                        key={m.value}
                                        type="button"
                                        onClick={() =>
                                          updateSysteme(armoireIndex, systemeIndex, 'modele', m.value)
                                        }
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                          systeme.modele === m.value
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                      >
                                        {m.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <NumberSelector
                                    value={systeme.quantite}
                                    onChange={(value) =>
                                      updateSysteme(
                                        armoireIndex,
                                        systemeIndex,
                                        'quantite',
                                        value
                                      )
                                    }
                                    label="Quantité"
                                    min={1}
                                    max={8}
                                  />
                                </div>
                              </div>

                              <div className="border-t pt-3 space-y-3">
                                <h6 className="text-sm font-medium text-gray-700">
                                  Produits supplémentaires
                                </h6>

                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`tube-${armoireIndex}-${systemeIndex}`}
                                    checked={systeme.tube}
                                    onChange={(e) =>
                                      updateSysteme(
                                        armoireIndex,
                                        systemeIndex,
                                        'tube',
                                        e.target.checked
                                      )
                                    }
                                    className="w-4 h-4 text-primary-600 rounded"
                                  />
                                  <label
                                    htmlFor={`tube-${armoireIndex}-${systemeIndex}`}
                                    className="ml-2 text-sm font-medium"
                                  >
                                    Tube
                                  </label>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`pressostat-${armoireIndex}-${systemeIndex}`}
                                      checked={systeme.pressostat}
                                      onChange={(e) =>
                                        updateSysteme(
                                          armoireIndex,
                                          systemeIndex,
                                          'pressostat',
                                          e.target.checked
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 rounded"
                                    />
                                    <label
                                      htmlFor={`pressostat-${armoireIndex}-${systemeIndex}`}
                                      className="ml-2 text-sm font-medium"
                                    >
                                      Pressostat NO/NF
                                    </label>
                                  </div>
                                  {systeme.pressostat && (
                                    <div className="ml-6 space-y-2">
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateSysteme(
                                              armoireIndex,
                                              systemeIndex,
                                              'pressostat_type',
                                              'NO'
                                            )
                                          }
                                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            systeme.pressostat_type === 'NO'
                                              ? 'bg-primary-600 text-white'
                                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                          }`}
                                        >
                                          NO
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateSysteme(
                                              armoireIndex,
                                              systemeIndex,
                                              'pressostat_type',
                                              'NO/NF'
                                            )
                                          }
                                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            systeme.pressostat_type === 'NO/NF'
                                              ? 'bg-primary-600 text-white'
                                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                          }`}
                                        >
                                          NO/NF
                                        </button>
                                      </div>
                                      <NumberSelector
                                        value={systeme.pressostat_quantite}
                                        onChange={(value) =>
                                          updateSysteme(armoireIndex, systemeIndex, 'pressostat_quantite', value)
                                        }
                                        label="Quantité"
                                        min={1}
                                        max={8}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`tete-sprinkler-${armoireIndex}-${systemeIndex}`}
                                      checked={systeme.tete_sprinkler}
                                      onChange={(e) =>
                                        updateSysteme(
                                          armoireIndex,
                                          systemeIndex,
                                          'tete_sprinkler',
                                          e.target.checked
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 rounded"
                                    />
                                    <label
                                      htmlFor={`tete-sprinkler-${armoireIndex}-${systemeIndex}`}
                                      className="ml-2 text-sm font-medium"
                                    >
                                      Tête sprinkler
                                    </label>
                                  </div>
                                  {systeme.tete_sprinkler && (
                                    <div className="ml-6 space-y-2">
                                      <div>
                                        <NumberSelector
                                          value={systeme.tete_sprinkler_quantite}
                                          onChange={(value) =>
                                            updateSysteme(
                                              armoireIndex,
                                              systemeIndex,
                                              'tete_sprinkler_quantite',
                                              value
                                            )
                                          }
                                          label="Quantité"
                                          min={1}
                                          max={8}
                                        />
                                      </div>
                                      <div>
                                        <label className="label text-sm">Température (°C)</label>
                                        <div className="flex flex-wrap gap-2">
                                          {TEMPERATURES.map((t) => (
                                            <button
                                              key={t}
                                              type="button"
                                              onClick={() =>
                                                updateSysteme(
                                                  armoireIndex,
                                                  systemeIndex,
                                                  'tete_sprinkler_temperature',
                                                  t
                                                )
                                              }
                                              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                                                systeme.tete_sprinkler_temperature === t
                                                  ? t === '68'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-primary-600 text-white'
                                                  : t === '68'
                                                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                              }`}
                                            >
                                              {t}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`sirene-flash-${armoireIndex}-${systemeIndex}`}
                                      checked={systeme.sirene_flash}
                                      onChange={(e) =>
                                        updateSysteme(
                                          armoireIndex,
                                          systemeIndex,
                                          'sirene_flash',
                                          e.target.checked
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 rounded"
                                    />
                                    <label
                                      htmlFor={`sirene-flash-${armoireIndex}-${systemeIndex}`}
                                      className="ml-2 text-sm font-medium"
                                    >
                                      Sirène flash
                                    </label>
                                  </div>
                                  {systeme.sirene_flash && (
                                    <div className="ml-6">
                                      <NumberSelector
                                        value={systeme.sirene_flash_quantite}
                                        onChange={(value) =>
                                          updateSysteme(armoireIndex, systemeIndex, 'sirene_flash_quantite', value)
                                        }
                                        label="Quantité"
                                        min={1}
                                        max={8}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {armoire.systemes.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              Aucun système ajouté. Cliquez sur "Ajouter" pour commencer.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-700 mb-3">Photos (max 5)</h5>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleCapturePhoto(armoireIndex)}
                              disabled={armoire.photos.length >= 5}
                              className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Camera className="w-5 h-5" />
                              Prendre une photo
                            </button>
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handlePhotoChange(armoireIndex, e)}
                                className="input"
                                disabled={armoire.photos.length >= 5}
                              />
                            </div>
                          </div>

                          {armoire.photos.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {armoire.photos.map((photo, photoIndex) => (
                                <div key={photoIndex} className="relative bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                                  <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`Photo ${photoIndex + 1}`}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(armoireIndex, photoIndex)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {existingPhotos.length > 0 && armoireIndex === 0 && (
                        <div className="border-t pt-4">
                          <h5 className="font-medium text-gray-700 mb-3">Photos existantes</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {existingPhotos.map((photo) => (
                              <div key={photo.id} className="relative bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                                <img
                                  src={photo.url_photo}
                                  alt={`Photo ${photo.position}`}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(releveId || selectedReleveFromList) && (
                        <div className="border-t pt-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">Actions</h5>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={addArmoire}
                                className="btn-secondary flex items-center justify-center space-x-2"
                              >
                                <Plus className="w-5 h-5" />
                                <span>Ajouter une autre armoire</span>
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-3">
                              Vous pouvez ajouter une autre armoire pour ce site ou valider les relevés en cliquant sur "Sauvegarder" en bas de page.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {armoires.length > 0 && (releveId || selectedReleveFromList) && (
            <div className="card">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="pret-a-signer"
                  checked={pretAsigner}
                  onChange={(e) => setPretAsigner(e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <label htmlFor="pret-a-signer" className="text-lg font-medium cursor-pointer">
                  Marquer comme prêt à signer
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2 ml-8">
                Cochez cette case pour rendre le relevé disponible dans la liste des relevés à signer.
              </p>
            </div>
          )}

          {armoires.length > 0 && (
            <div className="flex space-x-4">
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
                disabled={saving}
              >
                <Save className="w-5 h-5" />
                <span>
                  {saving
                    ? 'Enregistrement...'
                    : releveId || selectedReleveFromList
                      ? armoires.length > 1
                        ? `Sauvegarder (${armoires.length} armoire(s))`
                        : 'Modifier le relevé'
                      : `Sauvegarder ${armoires.length} armoire(s)`}
                </span>
              </button>
              {!releveId && !selectedReleveFromList && (
                <button
                  type="button"
                  onClick={addArmoire}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Ajouter une armoire</span>
                </button>
              )}
            </div>
          )}
        </form>
      )}

      {canProceed && !releveId && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Relevés existants</h3>
            {loadingReleves && <span className="text-sm text-gray-500">Chargement...</span>}
          </div>

          {siteReleves.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const groupedByDate = siteReleves.reduce((acc, releve) => {
                  const date = formatDate(releve.date_releve);
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(releve);
                  return acc;
                }, {} as Record<string, typeof siteReleves>);

                return Object.entries(groupedByDate).map(([date, releves]) => (
                  <div key={date} className="border rounded-lg bg-white">
                    <button
                      onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                      className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors p-4 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-primary-600" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Relevé du {date}</h3>
                          <p className="text-sm text-gray-600">
                            {releves.length} armoire{releves.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {expandedDate === date ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </button>

                    {expandedDate === date && (
                      <div className="px-4 pb-4 space-y-3 border-t pt-4">
                        {releves.map((releve) => {
                          const volume = releve.armoire?.hauteur && releve.armoire?.longueur && releve.armoire?.profondeur
                            ? (releve.armoire.hauteur * releve.armoire.longueur * releve.armoire.profondeur).toFixed(2)
                            : releve.armoire?.volume?.toString() || '-';

                          const systemeSummary = releve.systemes.length > 0
                            ? releve.systemes.map((s) => {
                                const modelLabel = MODELES.find((m) => m.value === s.modele)?.label || s.modele;
                                return `${modelLabel}m³ (x${s.quantite})`;
                              }).join(', ')
                            : 'Aucun système';

                          return (
                            <div
                              key={releve.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                selectedReleveFromList === releve.id
                                  ? 'bg-blue-50 border-blue-500 shadow-md'
                                  : 'bg-white hover:bg-gray-50 border-gray-300 hover:shadow-md'
                              }`}
                              onClick={() => handleSelectReleveFromList(releve.id)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-20 h-20">
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
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                                    {releve.armoire?.nom_armoire || 'Armoire sans nom'}
                                    {releve.armoire?.zone && (
                                      <span className="ml-2 text-sm font-normal text-gray-600">
                                        (Zone: {releve.armoire.zone})
                                      </span>
                                    )}
                                  </h4>
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
                                  <div className="mt-2">
                                    {releve.statut === 'brouillon' && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        Brouillon
                                      </span>
                                    )}
                                    {releve.statut === 'completée' && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                        En cours
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {selectedReleveFromList === releve.id && (
                                  <div className="flex-shrink-0">
                                    <div className="text-blue-600 font-bold">Sélectionné</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Aucun relevé existant pour ce site.
            </p>
          )}
        </div>
      )}

      {capturingPhoto && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={handleCancelCapture}
        />
      )}

      {showPreconisations && currentArmoireForPreco !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-6 h-6 text-primary-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Préconisations Système</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPreconisations(false);
                    setCurrentArmoireForPreco(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Informations de l'armoire</h4>
                  {(() => {
                    const armoire = armoires[currentArmoireForPreco];
                    const volume = calculateVolume(armoire.hauteur, armoire.longueur, armoire.profondeur);
                    return (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Nom:</span> {armoire.nom_armoire}</p>
                        <p><span className="font-medium">Dimensions:</span> L:{armoire.longueur}m × H:{armoire.hauteur}m × P:{armoire.profondeur}m</p>
                        <p><span className="font-medium">Volume:</span> {volume} m³</p>
                        <p><span className="font-medium">Cellules:</span> {armoire.nb_cellules || 'Non défini'}</p>
                        <p><span className="font-medium">Ventilation:</span> {armoire.ventilation ? `Oui (${armoire.nb_ventilations || 1})` : 'Non'}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="border-t pt-4">
                  <p className="text-gray-600 text-center py-8">
                    Les préconisations seront calculées automatiquement en fonction des paramètres de l'armoire.
                    <br />
                    <span className="text-sm text-gray-500">(Fonctionnalité en cours de développement)</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowPreconisations(false);
                    setCurrentArmoireForPreco(null);
                  }}
                  className="btn-primary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
