import { useState } from 'react';
import { FileText, Upload, Plus, Trash2, Download, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  'Documentation commerciale système',
  'Certificat CE',
  'Certificat ANPI',
  'Tableau de criticité',
  'Fiche technique armoire électrique',
  'Fiche technique batterie de condensateur',
];

const TRANSFER_TYPES = [
  'Installation',
  'Essai ANPI',
  'Démo',
  'Armoire ouverte',
  'Résistance',
];

export default function InfosPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'documentation' | 'transfert'>(
    'documentation'
  );
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState({
    titre: '',
    categorie: CATEGORIES[0],
    transferType: TRANSFER_TYPES[0],
    file: null as File | null,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Fonctionnalité d\'upload à implémenter');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Informations & Documents</h2>

      <div className="card">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('documentation')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'documentation'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Documentation
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('transfert')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'transfert'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transfert / Upload
            </button>
          )}
        </div>

        <div className="mt-6">
          {activeTab === 'documentation' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents disponibles</h3>
              {CATEGORIES.map((category, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-primary-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{category}</h4>
                      <p className="text-sm text-gray-500">
                        Catégorie de documentation
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-secondary text-sm flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>Voir</span>
                    </button>
                    <button className="btn-secondary text-sm flex items-center space-x-1">
                      <Download className="w-4 h-4" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Titre du document</label>
                <input
                  type="text"
                  value={uploadData.titre}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, titre: e.target.value })
                  }
                  className="input"
                  required
                  placeholder="Ex: Installation site Paris"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Catégorie</label>
                  <select
                    value={uploadData.categorie}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, categorie: e.target.value })
                    }
                    className="input"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Type de transfert</label>
                  <select
                    value={uploadData.transferType}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, transferType: e.target.value })
                    }
                    className="input"
                  >
                    {TRANSFER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Fichier (PDF, Image, Vidéo)</label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov"
                    className="input"
                    required
                  />
                  {uploadData.file && (
                    <span className="text-sm text-gray-600">
                      {uploadData.file.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Uploader</span>
                </button>
                <button type="button" className="btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
