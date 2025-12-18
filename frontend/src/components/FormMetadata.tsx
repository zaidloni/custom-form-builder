interface FormMetadataProps {
  name: string;
  description: string;
  slug?: string;
  formUrl?: string;
  version?: number;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function FormMetadata({
  name,
  description,
  slug,
  formUrl,
  version,
  onNameChange,
  onDescriptionChange,
}: FormMetadataProps) {
  const copyUrl = () => {
    if (formUrl) {
      navigator.clipboard.writeText(formUrl);
      // Could add a toast notification here
      alert('URL copied to clipboard!');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Form Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter form name"
          maxLength={255}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter form description"
          rows={3}
          maxLength={255}
          required
        />
      </div>

      {slug && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (read-only)
              </label>
              <p className="text-sm text-gray-600 font-mono">{slug}</p>
              {version !== undefined && (
                <p className="text-xs text-gray-500 mt-1">Version {version}</p>
              )}
            </div>
            {formUrl && (
              <button
                onClick={copyUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Copy Public URL
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

