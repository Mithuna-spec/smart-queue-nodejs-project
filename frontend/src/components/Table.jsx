import React from "react";

const Table = ({ 
    headers = [], 
    children, 
    loading = false, 
    emptyMessage = "No items found" 
}) => {
    return (
        <div className="w-full overflow-x-auto bg-[#292A2F] border border-[#35363B] rounded-xl">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-[#35363B] bg-[#202126]/50">
                        {headers.map((h, i) => (
                            <th 
                                key={i} 
                                className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#A8A8A8] select-none"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={headers.length} className="px-6 py-12 text-center text-[#A8A8A8]">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#DC423E]"></div>
                                    <span className="text-xs">Loading data...</span>
                                </div>
                            </td>
                        </tr>
                    ) : React.Children.count(children) === 0 ? (
                        <tr>
                            <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-[#707176]">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        children
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
