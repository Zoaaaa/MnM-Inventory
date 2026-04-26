import { useState } from 'react';
import { productsApi } from '../../lib/api';
import toast from 'react-hot-toast';

function ImportPage() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await productsApi.import(formData);
      setResult(response.data);
      toast.success(`Imported ${response.data.imported} products`);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV or Excel file to bulk import or update products
        </p>
      </div>

      {/* File format guide */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">📋 File Format</h2>
        <p className="text-sm text-gray-600 mb-3">
          Your file should have the following columns (header row required):
        </p>
        <div className="overflow-x-auto">
          <table className="text-sm border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Column</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Required</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-mono text-xs">name</td>
                <td className="px-3 py-2 text-green-600">Yes</td>
                <td className="px-3 py-2 text-gray-600">MoYu RS3M 2024</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">category</td>
                <td className="px-3 py-2 text-gray-400">No</td>
                <td className="px-3 py-2 text-gray-600">3x3</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">price</td>
                <td className="px-3 py-2 text-green-600">Yes</td>
                <td className="px-3 py-2 text-gray-600">450</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">stock</td>
                <td className="px-3 py-2 text-gray-400">No</td>
                <td className="px-3 py-2 text-gray-600">25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">description</td>
                <td className="px-3 py-2 text-gray-400">No</td>
                <td className="px-3 py-2 text-gray-600">Budget-friendly magnetic 3x3</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 If a product with the same name already exists, it will be updated instead of duplicated.
        </p>
      </div>

      {/* Upload form */}
      <form onSubmit={handleImport} className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">📤 Upload File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            id="file-input"
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer"
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm text-gray-600">
              {file ? (
                <span className="font-medium text-primary-600">{file.name}</span>
              ) : (
                <>
                  <span className="text-primary-600 font-medium">Click to select</span> a CSV or Excel file
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports .csv, .xls, .xlsx (max 5MB)</p>
          </label>
        </div>

        <button
          type="submit"
          disabled={!file || importing}
          className="btn-primary w-full mt-4"
        >
          {importing ? 'Importing...' : 'Import Products'}
        </button>
      </form>

      {/* Import results */}
      {result && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">📊 Import Results</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-xs text-gray-500">Total Rows</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{result.imported}</p>
              <p className="text-xs text-green-600">Imported</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{result.skipped}</p>
              <p className="text-xs text-red-600">Skipped</p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
              <ul className="text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImportPage;
