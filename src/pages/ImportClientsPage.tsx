import { useState, useCallback } from 'react';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ClientData {
  index: number;
  nom: string;
  adresse: string;
  adresse2?: string | null;
  code_postal: string;
  ville: string;
  contact?: string | null;
  telephone?: string | null;
  email?: string | null;
  multi_site: boolean;
  valid: boolean;
}

interface ImportError {
  client: string;
  error: string;
}

export default function ImportClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setImportErrors([]);
      setMessage(null);

      const XLSX = await import('xlsx');
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const processedClients = jsonData.map((row: any, index: number) => {
            const nom = row['Raison sociale'] || row['Client'] || '';
            const adresse = row['Adresse'] || '';
            const codePostal = row['Code postal'] ? String(row['Code postal']) : '';
            const ville = row['Ville'] || '';

            return {
              index,
              nom,
              adresse,
              adresse2: row['Adresse complémentaire (2ème ligne)'] || null,
              code_postal: codePostal,
              ville,
              contact: null,
              telephone: row['Téléphone'] || row['Mobile'] || null,
              email: row['Email'] || null,
              multi_site: false,
              valid: !!(nom && adresse && codePostal && ville)
            };
          }).filter((client: ClientData) => client.nom);

          setClients(processedClients);
          const validIndices = new Set(
            processedClients
              .map((c: ClientData, i: number) => c.valid ? i : -1)
              .filter((i: number) => i !== -1)
          );
          setSelectedIndices(validIndices);
        } catch (error) {
          setMessage({ text: 'Erreur lors de la lecture du fichier', type: 'error' });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setMessage({ text: 'Erreur lors du chargement du fichier', type: 'error' });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xls') || file.name.endsWith('.xlsx'))) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(clients.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const downloadErrors = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(
      importErrors.map(err => ({
        'Client': err.client,
        'Raison de l\'erreur': err.error
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Erreurs d\'import');
    XLSX.writeFile(wb, `erreurs-import-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setMessage(null);
    setImportErrors([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const selectedClients = Array.from(selectedIndices)
        .map(index => clients[index])
        .filter(client => client.valid);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-clients`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clients: selectedClients })
        }
      );

      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'import');
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        setMessage({
          text: `✅ ${result.imported} client(s) importé(s) avec succès. ⚠️ ${result.errors.length} client(s) non importé(s).`,
          type: 'info'
        });
      } else {
        setMessage({
          text: `✅ ${result.imported} client(s) importé(s) avec succès !`,
          type: 'success'
        });
        setTimeout(() => navigate('/clients'), 2000);
      }

      setSelectedIndices(new Set());
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Erreur lors de l\'import',
        type: 'error'
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const validCount = clients.filter(c => c.valid).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour aux clients
          </button>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Import de clients depuis Excel
          </h1>
        </div>

        {clients.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
          >
            <div className="p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Glissez-déposez votre fichier Excel ici
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                ou cliquez pour sélectionner un fichier
              </p>
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <span className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Choisir un fichier
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-gray-600">Clients trouvés</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl font-bold text-green-600">{selectedIndices.size}</div>
                <div className="text-sm text-gray-600">Clients sélectionnés</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl font-bold text-purple-600">{validCount}</div>
                <div className="text-sm text-gray-600">Clients valides</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tout sélectionner
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Tout désélectionner
              </button>
              <button
                onClick={handleImport}
                disabled={selectedIndices.size === 0 || importing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Import en cours...' : `Importer ${selectedIndices.size} client(s)`}
              </button>
            </div>

            {importing && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {message && (
              <div className={`rounded-lg p-4 ${
                message.type === 'success' ? 'bg-green-50 text-green-800' :
                message.type === 'error' ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-red-50 border-b border-red-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Clients non importés ({importErrors.length})
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        Les clients suivants n'ont pas pu être importés. Vérifiez les erreurs ci-dessous.
                      </p>
                    </div>
                    <button
                      onClick={downloadErrors}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger la liste
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Raison
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importErrors.map((error, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {error.client}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            {error.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600 border-t border-gray-200">
                  💡 Conseil : Corrigez les erreurs dans votre fichier Excel et réessayez l'import pour ces clients.
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === clients.length}
                          onChange={() => selectedIndices.size === clients.length ? deselectAll() : selectAll()}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adresse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code postal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ville
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Téléphone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client, index) => (
                      <tr
                        key={index}
                        className={`${selectedIndices.has(index) ? 'bg-blue-50' : ''} ${!client.valid ? 'opacity-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIndices.has(index)}
                            onChange={() => toggleSelection(index)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.nom}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {client.adresse}
                          {client.adresse2 && <div className="text-xs">{client.adresse2}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.code_postal}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.ville}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.telephone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.email || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
