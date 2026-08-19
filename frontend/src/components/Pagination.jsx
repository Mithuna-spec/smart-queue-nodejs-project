import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ currentPage, totalPages, totalRecords, onPageChange, limit = 10 }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const startRecord = (currentPage - 1) * limit + 1;
    const endRecord = Math.min(currentPage * limit, totalRecords);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-[#292A2F] border-t border-[#35363B] rounded-b-xl select-none">
            {/* Record range display */}
            <div className="text-xs text-[#A8A8A8]">
                Showing <span className="font-bold text-[#F5F5F5]">{startRecord}</span> to{" "}
                <span className="font-bold text-[#F5F5F5]">{endRecord}</span> of{" "}
                <span className="font-bold text-[#F5F5F5]">{totalRecords}</span> entries
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-[#A8A8A8] hover:text-[#F5F5F5] disabled:text-[#707176] hover:bg-[#202126] disabled:hover:bg-transparent rounded-lg transition-all"
                    title="Previous Page"
                >
                    <FiChevronLeft size={16} />
                </button>

                {getPageNumbers().map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            currentPage === page
                                ? "bg-[#DC423E] text-[#F5F5F5]"
                                : "text-[#A8A8A8] hover:text-[#F5F5F5] hover:bg-[#202126]"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-[#A8A8A8] hover:text-[#F5F5F5] disabled:text-[#707176] hover:bg-[#202126] disabled:hover:bg-transparent rounded-lg transition-all"
                    title="Next Page"
                >
                    <FiChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
