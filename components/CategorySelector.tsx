import React, { useState, useRef, useEffect } from 'react';
import { Tag, Plus, Trash2, Check, ChevronDown, FolderPlus, X } from 'lucide-react';
import { ShoppingCategory, DEFAULT_SHOPPING_CATEGORIES } from '../types';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  categories?: string[];
  onAddCategory?: (category: string) => Promise<any> | void;
  onDeleteCategory?: (category: string) => Promise<any> | void;
  label?: string;
  className?: string;
  compact?: boolean;
  required?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  categories = DEFAULT_SHOPPING_CATEGORIES,
  onAddCategory,
  onDeleteCategory,
  label = "Categoria",
  className = "",
  compact = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  const activeCategories = Array.from(
    new Set([...(categories && categories.length > 0 ? categories : DEFAULT_SHOPPING_CATEGORIES)])
  );

  // Filter categories by search
  const filteredCategories = activeCategories.filter((c) =>
    c.toLowerCase().includes(searchFilter.trim().toLowerCase())
  );

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setIsAddingNew(false);
  };

  const handleAddNewCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (onAddCategory) {
      await onAddCategory(trimmed);
    }
    onChange(trimmed);
    setNewCatName("");
    setIsAddingNew(false);
    setIsOpen(false);
  };

  const handleDelete = async (categoryToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (activeCategories.length <= 1) {
      return;
    }

    if (onDeleteCategory) {
      await onDeleteCategory(categoryToDelete);
    }
    if (value === categoryToDelete) {
      const remaining = activeCategories.filter((c) => c !== categoryToDelete);
      onChange(remaining[0] || "Outros");
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" />
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(true);
              setIsAddingNew(true);
            }}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Nova Categoria
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left transition-all border outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
          compact
            ? "py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white"
            : "p-3 text-sm rounded-xl bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0 text-xs font-bold">
            #
          </span>
          <span className="font-bold truncate">{value || "Selecione a Categoria"}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in divide-y divide-slate-100 dark:divide-slate-700/60 min-w-[290px] w-full max-w-[340px]">
          {/* Header & Quick Action */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Categorias ({activeCategories.length})
            </span>
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar
              </button>
            )}
          </div>

          {/* Inline Add Category Form */}
          {isAddingNew && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <FolderPlus className="w-3.5 h-3.5" />
                    Nova Categoria
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ex: Pet Shop, Lanches..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddNewCategory();
                      } else if (e.key === "Escape") {
                        setIsAddingNew(false);
                      }
                    }}
                    className="flex-1 min-w-0 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddNewCategory();
                    }}
                    disabled={!newCatName.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap shadow-sm"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-700/30">
            {filteredCategories.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Nenhuma categoria encontrada.
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = value === cat;
                return (
                  <div
                    key={cat}
                    className={`flex items-center justify-between px-3 py-2 text-xs transition-colors group cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-medium"
                    }`}
                    onClick={() => handleSelect(cat)}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{cat}</span>
                    </div>

                    {/* Delete Category Button */}
                    <button
                      type="button"
                      title={`Excluir categoria "${cat}"`}
                      onClick={(e) => handleDelete(cat, e)}
                      className="opacity-60 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Action if not adding */}
          {!isAddingNew && (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full text-left px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Criar nova categoria</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
