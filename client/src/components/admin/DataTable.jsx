import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Pagination from './Pagination';

const DataTable = ({ 
  columns, 
  data, 
  keyField = 'id', 
  loading = false, 
  page, 
  totalPages, 
  onPageChange,
  onSort,
  sortField,
  sortOrder,
  emptyMessage = "No records found"
}) => {
  const handleSortClick = (field, isSortable) => {
    if (!isSortable || !onSort || !field) return;
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`px-6 py-4 whitespace-nowrap select-none ${col.sortable && col.field ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                  onClick={() => handleSortClick(col.field, col.sortable)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && col.field && sortField === col.field && (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="text-indigo-500" /> : <ArrowDown size={14} className="text-indigo-500" />
                    )}
                    {col.sortable && col.field && sortField !== col.field && (
                      <div className="flex flex-col text-slate-300 opacity-50">
                        <ArrowUp size={10} className="-mb-1" />
                        <ArrowDown size={10} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={row[keyField] || rowIndex} className="hover:bg-slate-50/80 transition-colors duration-150">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.field]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={onPageChange} 
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
