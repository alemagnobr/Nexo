import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit, 
  Search, 
  Package, 
  AlertTriangle, 
  Check, 
  ShoppingCart, 
  PlusCircle, 
  X, 
  Filter,
  CheckCircle2,
  History,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  RefreshCw,
  Star
} from 'lucide-react';
import { InventoryItem, ShoppingCategory, ReplenishmentLog, ShoppingItem, RegisteredProduct } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  replenishmentLogs?: ReplenishmentLog[];
  shoppingList?: ShoppingItem[];
  registeredProducts?: RegisteredProduct[];
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
  onDelete: (id: string) => void;
  onAddReplenishmentLog: (log: Omit<ReplenishmentLog, 'id'>) => void;
  onClearReplenishmentHistory: () => void;
  onAddToShoppingList: (item: { name: string; category: any; unit: string; quantity: number; month?: string }) => void;
  onAddRegisteredProduct?: (product: Omit<RegisteredProduct, "id">) => Promise<any> | void;
  onUpdateRegisteredProduct?: (id: string, updates: Partial<RegisteredProduct>) => Promise<any> | void;
  privacyMode: boolean;
}

const CATEGORIES: ShoppingCategory[] = [
  'Hortifruti', 'Carnes', 'Laticínios', 'Mercearia', 'Padaria', 'Bebidas', 'Limpeza', 'Higiene', 'Outros'
];

export const getStockStatusDetails = (item: InventoryItem) => {
  if (item.minQuantity !== undefined && item.quantity < item.minQuantity) {
    return {
      label: "Aumentar estoque",
      classes: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30",
      description: "Nível abaixo do mínimo configurado."
    };
  } else if (item.isMandatory) {
    return {
      label: "Obrigatório",
      classes: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30",
      description: "Item de compra obrigatória (sempre repor pelo menos +1)."
    };
  } else {
    return {
      label: "Estoque está bom",
      classes: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30",
      description: "Estoque adequado ou acima do mínimo."
    };
  }
};

export const Inventory: React.FC<InventoryProps> = ({
  items = [],
  replenishmentLogs = [],
  shoppingList = [],
  registeredProducts = [],
  onAdd,
  onUpdate,
  onDelete,
  onAddReplenishmentLog,
  onClearReplenishmentHistory,
  onAddToShoppingList,
  onAddRegisteredProduct,
  onUpdateRegisteredProduct,
  privacyMode
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  // Lançar para lista de compras (Modal & Lógica)
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [selectedLaunchMonth, setSelectedLaunchMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [launchResultModal, setLaunchResultModal] = useState<{
    isOpen: boolean;
    messages: string[];
    addedCount: number;
    skippedCount: number;
    monthLabel: string;
  } | null>(null);

  const getMonthsFromCurrentYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 to 11
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const list: { label: string; value: string }[] = [];
    for (let m = currentMonth; m <= 11; m++) {
      const monthStr = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      list.push({
        label: `${monthNames[m]} de ${currentYear}`,
        value: monthStr
      });
    }
    return list;
  };

  const handleLaunchToShoppingList = () => {
    const months = getMonthsFromCurrentYear();
    const monthObj = months.find(m => m.value === selectedLaunchMonth) || { label: selectedLaunchMonth };
    const monthLabel = monthObj.label;

    const messages: string[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    const itemsNeedingReplenishment = items.filter(item => {
      const minQty = Number(item.minQuantity) || 0;
      const currentQty = Number(item.quantity) || 0;
      return (minQty > currentQty) || !!item.isMandatory;
    });

    if (itemsNeedingReplenishment.length === 0) {
      messages.push("Todos os produtos do seu estoque já estão com a quantidade atual igual ou superior à quantidade mínima e nenhum foi marcado como obrigatório. Nenhum item precisou ser lançado na lista de compras.");
    } else {
      const currentMonthStr = new Date().toISOString().slice(0, 7);

      itemsNeedingReplenishment.forEach(item => {
        const minQty = Number(item.minQuantity) || 0;
        const currentQty = Number(item.quantity) || 0;
        const rawMissing = Math.max(0, minQty - currentQty);

        // Se for item obrigatório, a necessidade é pelo menos +1, ou a falta total se maior.
        const neededQty = item.isMandatory ? Math.max(1, rawMissing) : rawMissing;

        const existingInMonth = shoppingList.filter(s => {
          const sMonth = s.month || currentMonthStr;
          return sMonth === selectedLaunchMonth && s.name.trim().toLowerCase() === item.name.trim().toLowerCase();
        });

        const existingQty = existingInMonth.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

        if (existingQty >= neededQty) {
          skippedCount++;
          messages.push(`• "${item.name}": Já existem ${existingQty} produto(s) lançados na lista de compras de ${monthLabel} (necessário: ${neededQty}).`);
        } else {
          const toAdd = neededQty - existingQty;
          onAddToShoppingList({
            name: item.name,
            category: item.category as ShoppingCategory,
            unit: item.unit || 'un',
            quantity: toAdd,
            month: selectedLaunchMonth
          });
          addedCount++;

          if (item.isMandatory && rawMissing === 0) {
            messages.push(`• "${item.name}" (Obrigatório): Lançado +${toAdd} ${item.unit} na lista de ${monthLabel} para manter reposição contínua.`);
          } else if (existingQty === 0) {
            messages.push(`• "${item.name}"${item.isMandatory ? ' (Obrigatório)' : ''}: Lançado(s) ${neededQty} ${item.unit} na lista de compras de ${monthLabel}.`);
          } else {
            messages.push(`• "${item.name}"${item.isMandatory ? ' (Obrigatório)' : ''}: Já existiam ${existingQty} ${item.unit} na lista; adicionado saldo de +${toAdd} ${item.unit} em ${monthLabel}.`);
          }
        }
      });
    }

    setIsLaunchModalOpen(false);
    setLaunchResultModal({
      isOpen: true,
      messages,
      addedCount,
      skippedCount,
      monthLabel
    });
  };
  
  // Stock list state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterReplenish, setFilterReplenish] = useState<boolean | null>(null); // null = all, true = needs replenish, false = ok

  // History list state
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'purchase' | 'manual'>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('all'); // format "YYYY-MM" or "all"

  // Modal / Add item state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState('un');
  const [itemCategory, setItemCategory] = useState<ShoppingCategory>('Outros');
  const [itemMinQuantity, setItemMinQuantity] = useState<number>(1);
  const [itemIsMandatory, setItemIsMandatory] = useState<boolean>(false);
  const [itemPersistedMonths, setItemPersistedMonths] = useState<number>(0);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Suggestions derived from registeredProducts
  const productSuggestions = React.useMemo(() => {
    if (!registeredProducts || registeredProducts.length === 0) return [];
    const query = itemName.trim().toLowerCase();
    if (!query) return registeredProducts.slice(0, 8);
    return registeredProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [registeredProducts, itemName]);

  const selectedRegisteredProduct = React.useMemo(() => {
    if (!registeredProducts || !itemName.trim()) return null;
    return registeredProducts.find(
      p => p.name.trim().toLowerCase() === itemName.trim().toLowerCase()
    );
  }, [registeredProducts, itemName]);

  const handleSelectProductSuggestion = (prod: RegisteredProduct) => {
    setItemName(prod.name);
    if (prod.category) setItemCategory(prod.category as ShoppingCategory);
    if (prod.unit) setItemUnit(prod.unit);
    setShowProductSuggestions(false);
  };

  const resetForm = () => {
    setItemName('');
    setItemQuantity(1);
    setItemUnit('un');
    setItemCategory('Outros');
    setItemMinQuantity(1);
    setItemIsMandatory(false);
    setItemPersistedMonths(0);
    setEditingItem(null);
    setShowProductSuggestions(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity);
    setItemUnit(item.unit);
    setItemCategory(item.category as ShoppingCategory);
    setItemMinQuantity(item.minQuantity || 0);
    setItemIsMandatory(!!item.isMandatory);
    setItemPersistedMonths(item.persistedMonthsCount || 0);
    setShowProductSuggestions(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const qty = Number(itemQuantity);
    const minQty = Number(itemMinQuantity);

    const itemData = {
      name: itemName.trim(),
      quantity: qty,
      unit: itemUnit,
      category: itemCategory,
      minQuantity: minQty,
      isMandatory: itemIsMandatory,
      persistedMonthsCount: Number(itemPersistedMonths)
    };

    // --- SINCRONIZAÇÃO AUTOMÁTICA COM O BANCO DE PRODUTOS (registeredProducts) ---
    const trimmedNewName = itemData.name.toLowerCase();
    const trimmedOldName = editingItem ? editingItem.name.trim().toLowerCase() : '';

    const existingRegistered = registeredProducts?.find(
      p => p.name.trim().toLowerCase() === trimmedNewName || (trimmedOldName && p.name.trim().toLowerCase() === trimmedOldName)
    );

    if (existingRegistered) {
      if (onUpdateRegisteredProduct) {
        onUpdateRegisteredProduct(existingRegistered.id, {
          name: itemData.name,
          category: itemData.category,
          unit: itemData.unit,
        });
      }
    } else if (onAddRegisteredProduct) {
      onAddRegisteredProduct({
        name: itemData.name,
        category: itemData.category,
        unit: itemData.unit,
      });
    }

    if (editingItem) {
      onUpdate(editingItem.id, itemData);
      
      // If quantity increased, log manual replenishment
      if (qty > editingItem.quantity) {
        onAddReplenishmentLog({
          itemName: itemData.name,
          quantityAdded: qty - editingItem.quantity,
          unit: itemUnit,
          category: itemCategory,
          date: new Date().toISOString(),
          type: 'manual'
        });
      }
    } else {
      onAdd(itemData);
      
      // Log new stock as manual replenishment if qty > 0
      if (qty > 0) {
        onAddReplenishmentLog({
          itemName: itemData.name,
          quantityAdded: qty,
          unit: itemUnit,
          category: itemCategory,
          date: new Date().toISOString(),
          type: 'manual'
        });
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleQuantityChange = (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    onUpdate(id, { quantity: newQty });

    // If delta is positive, log manual replenishment
    if (delta > 0) {
      const item = items.find(i => i.id === id);
      if (item) {
        onAddReplenishmentLog({
          itemName: item.name,
          quantityAdded: delta,
          unit: item.unit || 'un',
          category: item.category || 'Outros',
          date: new Date().toISOString(),
          type: 'manual'
        });
      }
    }
  };

  const handleAddBackToShopping = (item: InventoryItem) => {
    const minQty = Number(item.minQuantity) || 0;
    const currentQty = Number(item.quantity) || 0;
    const rawMissing = Math.max(0, minQty - currentQty);
    const qtyToAdd = item.isMandatory
      ? Math.max(1, rawMissing)
      : (minQty && currentQty < minQty ? Math.max(1, rawMissing) : 1);

    onAddToShoppingList({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: qtyToAdd
    });
  };

  // Filter items (Current Stock)
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    const needsReplenish = (item.minQuantity !== undefined && item.quantity < item.minQuantity) || !!item.isMandatory;
    const matchesReplenish = filterReplenish === null || (filterReplenish === needsReplenish);

    return matchesSearch && matchesCategory && matchesReplenish;
  });

  // Filter Replenishment Logs
  const filteredLogs = replenishmentLogs
    .filter(log => {
      const matchesSearch = log.itemName.toLowerCase().includes(historySearch.toLowerCase());
      const matchesType = historyTypeFilter === 'all' || log.type === historyTypeFilter;
      
      let matchesMonth = true;
      if (historyMonthFilter !== 'all' && log.date) {
        matchesMonth = log.date.substring(0, 7) === historyMonthFilter;
      }

      return matchesSearch && matchesType && matchesMonth;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Extract distinct months for dropdown filter
  const distinctMonths = Array.from(
    new Set(
      replenishmentLogs
        .filter(log => log.date)
        .map(log => log.date.substring(0, 7))
    )
  ).sort((a, b) => b.localeCompare(a));

  const totalItems = items.length;
  const itemsLow = items.filter(item => item.minQuantity !== undefined && item.quantity < item.minQuantity).length;

  // Analysis / Recommendation Logic for adjusting next month's shopping quantities
  const getPlanningSuggestions = () => {
    const suggestionList: {
      itemName: string;
      category: string;
      unit: string;
      totalReplenished: number;
      currentStock: number;
      minQuantity: number;
      recommendation: string;
      status: 'increase' | 'decrease' | 'balanced';
    }[] = [];

    // Aggregate replenishment amounts per item
    const agg: Record<string, { total: number; unit: string; category: string }> = {};
    
    // Use selected month's logs if possible, else use all logs
    const activeLogsForAnalysis = historyMonthFilter !== 'all' 
      ? replenishmentLogs.filter(log => log.date && log.date.substring(0, 7) === historyMonthFilter)
      : replenishmentLogs;

    activeLogsForAnalysis.forEach(log => {
      const key = log.itemName.trim().toLowerCase();
      if (!agg[key]) {
        agg[key] = { total: 0, unit: log.unit || 'un', category: log.category || 'Outros' };
      }
      agg[key].total += log.quantityAdded;
    });

    // Match with current inventory to make recommendations
    items.forEach(invItem => {
      const key = invItem.name.trim().toLowerCase();
      const totalReplenished = agg[key]?.total || 0;
      const minQty = invItem.minQuantity || 0;
      const current = invItem.quantity;
      const persistedMonths = invItem.persistedMonthsCount || 0;

      let recommendation = '';
      let status: 'increase' | 'decrease' | 'balanced' = 'balanced';

      // 0. Persisted for at least 2 months
      if (persistedMonths >= 2 && current > 0) {
        recommendation = `Persistência Detectada: O produto persistiu por pelo menos 2 meses no estoque (${current} ${invItem.unit}). Sugerimos diminuir a quantidade de compra para o próximo mês em pelo menos 30% para controlar melhor o estoque.`;
        status = 'decrease';
      }
      // 1. Stock is empty/low despite some replenishment -> shortage risk
      else if (current < minQty && totalReplenished > 0) {
        recommendation = `Falta Detectada: Você repôs ${totalReplenished} ${invItem.unit} este mês, mas o estoque continua muito baixo (${current} ${invItem.unit}). Sugerimos aumentar a quantidade de compra para o próximo mês em pelo menos 20-30%.`;
        status = 'increase';
      }
      // 2. High stock and high replenishment or high stock and no replenish -> maybe excess
      else if (current > minQty * 2 && totalReplenished > 0) {
        recommendation = `Excesso Detectado: Você repôs ${totalReplenished} ${invItem.unit} e o estoque atual está muito alto (${current} ${invItem.unit}). Recomendamos comprar menos no próximo mês para evitar desperdício e economizar.`;
        status = 'decrease';
      }
      // 3. Stock is empty and no replenishment recorded
      else if (current < minQty && totalReplenished === 0) {
        recommendation = `Pendente: Este item está abaixo do mínimo ideal e não teve nenhuma reposição registrada. Adicione à sua lista de compras.`;
        status = 'increase';
      }
      // 4. Balanced
      else {
        recommendation = `Estoque Saudável: A média de reposição está em equilíbrio com o consumo da sua casa. Mantenha os níveis atuais.`;
        status = 'balanced';
      }

      // Only add to suggestions if there was active replenishment, if it is low on stock, or if it persisted
      if (totalReplenished > 0 || current < minQty || (persistedMonths >= 2 && current > 0)) {
        suggestionList.push({
          itemName: invItem.name,
          category: invItem.category,
          unit: invItem.unit || 'un',
          totalReplenished,
          currentStock: current,
          minQuantity: minQty,
          recommendation,
          status
        });
      }
    });

    return suggestionList;
  };

  const suggestions = getPlanningSuggestions();
  const suggestionsToIncrease = suggestions.filter(s => s.status === 'increase');
  const suggestionsToDecrease = suggestions.filter(s => s.status === 'decrease');

  const handleClearHistoryConfirm = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico de reposição? Esta ação é irreversível.")) {
      onClearReplenishmentHistory();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Controle de Estoque & Reposição
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitore o estoque de itens da sua casa, registre o histórico de reposições e ajuste suas compras do mês.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              setSelectedLaunchMonth(new Date().toISOString().slice(0, 7));
              setIsLaunchModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Lançar para lista de compras
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Item no Estoque
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider ${
            activeTab === 'stock'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque Atual ({totalItems})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-black border-b-2 transition-all uppercase tracking-wider ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico de Reposições ({replenishmentLogs.length})
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Itens Registrados</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{totalItems}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
              <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Precisa de Reposição</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">{itemsLow}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Estoque Adequado</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalItems - itemsLow}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar item no estoque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas Categorias</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status buttons */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 self-start lg:self-auto shrink-0">
                <button
                  onClick={() => setFilterReplenish(null)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterReplenish === null
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterReplenish(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    filterReplenish === true
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-rose-500 hover:bg-rose-500/10'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reposição ({itemsLow})
                </button>
                <button
                  onClick={() => setFilterReplenish(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    filterReplenish === false
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-emerald-500 hover:bg-emerald-500/10'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Adequado ({totalItems - itemsLow})
                </button>
              </div>
            </div>
          </div>

          {/* Grid of items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum item encontrado no estoque.</p>
              <p className="text-slate-400 text-xs mt-1">Experimente mudar seus filtros ou adicione um novo item.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const statusDetails = getStockStatusDetails(item);
                const borderClass = statusDetails.label === "Diminuir estoque"
                  ? "border-amber-300 dark:border-amber-900/50 shadow-md shadow-amber-500/[0.02]"
                  : statusDetails.label === "Aumentar estoque"
                    ? "border-rose-300 dark:border-rose-900/50 shadow-md shadow-rose-500/[0.02]"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm";
                
                return (
                  <div 
                    key={item.id} 
                    className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all p-4 flex flex-col justify-between gap-4 ${borderClass}`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                          {item.category || 'Outros'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {item.isMandatory && (
                            <span className="text-[10px] font-extrabold flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Obrigatório
                            </span>
                          )}
                          <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md ${statusDetails.classes}`}>
                            {statusDetails.label === "Diminuir estoque" && <TrendingDown className="w-3 h-3" />}
                            {statusDetails.label === "Aumentar estoque" && <AlertTriangle className="w-3 h-3" />}
                            {statusDetails.label === "Estoque está bom" && <Check className="w-3 h-3" />}
                            {statusDetails.label === "Obrigatório" && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                            {statusDetails.label}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 dark:text-white text-base truncate flex items-center justify-between gap-2">
                        <span>{privacyMode ? '••••••' : item.name}</span>
                      </h4>
                      
                      <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span>Mínimo Recomendado:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {item.minQuantity ?? 0} {(item.unit || 'un').toUpperCase()}
                          </span>
                        </div>
                        {item.isMandatory && (
                          <div className="flex justify-between text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                            <span>Regra de compra:</span>
                            <span>Sempre pelo menos +1 (ou a falta se &gt; 1)</span>
                          </div>
                        )}
                        {item.persistedMonthsCount !== undefined && item.persistedMonthsCount > 0 && (
                          <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <span>Persistência no Estoque:</span>
                            <span>{item.persistedMonthsCount} {item.persistedMonthsCount === 1 ? 'mês' : 'meses'}</span>
                          </div>
                        )}
                        {item.updatedAt && (
                          <div className="flex justify-between text-[10px]">
                            <span>Última atualização:</span>
                            <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-1">
                      {/* Quantity adjustment controls */}
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-12 text-center text-sm font-black text-slate-700 dark:text-white flex items-center justify-center gap-0.5">
                          <span>{privacyMode ? '••' : item.quantity}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{item.unit || 'un'}</span>
                        </div>
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdate(item.id, { isMandatory: !item.isMandatory })}
                          title={item.isMandatory ? "Remover marcação de item obrigatório" : "Marcar como item obrigatório nas compras (sempre repor +1)"}
                          className={`p-2 rounded-xl transition-all border ${
                            item.isMandatory
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                              : "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700 border-transparent"
                          }`}
                        >
                          <Star className={`w-4 h-4 ${item.isMandatory ? "fill-amber-500 text-amber-500" : ""}`} />
                        </button>
                        {((item.minQuantity !== undefined && item.quantity < item.minQuantity) || item.isMandatory) && (
                          <button
                            onClick={() => handleAddBackToShopping(item)}
                            title="Adicionar à lista de compras para reposição"
                            className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-all border border-indigo-100 dark:border-indigo-900/30"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Editar"
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          title="Excluir"
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Intelligent Planning & recommendation assistant (💡 Assistente de Planejamento de Compras) */}
          <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/20 dark:to-sky-950/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">💡 Assistente de Planejamento de Compras</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cruzamos o seu histórico de reposições de {historyMonthFilter === 'all' ? 'todos os meses' : 'este mês'} com o seu estoque para ajustar as compras para o próximo mês.
                </p>
              </div>
            </div>

            {/* Smart Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Shortages Alert */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <h4 className="text-xs font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Consumo Alto (Comprar Mais no Próximo Mês)
                </h4>
                {suggestionsToIncrease.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum item em falta recorrente detectado. Seu plano de compras está cobrindo a demanda!</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {suggestionsToIncrease.slice(0, 4).map(s => (
                      <div key={s.itemName} className="text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                          <span>{s.itemName}</span>
                          <span className="text-rose-600 dark:text-rose-400">Estoque: {s.currentStock} {s.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Excess Alert */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <h4 className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  Sobra / Excesso (Comprar Menos no Próximo Mês)
                </h4>
                {suggestionsToDecrease.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum item com estoque excessivo detectado. Ritmo ideal de consumo e compras!</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {suggestionsToDecrease.slice(0, 4).map(s => (
                      <div key={s.itemName} className="text-xs border-b border-slate-100 dark:border-slate-700 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                          <span>{s.itemName}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">Estoque: {s.currentStock} {s.unit}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Filters Card */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar no histórico de reposição..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Month selector */}
              <div className="w-full lg:w-48 relative">
                <select
                  value={historyMonthFilter}
                  onChange={(e) => setHistoryMonthFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos os Meses</option>
                  {distinctMonths.map(m => {
                    const [year, month] = m.split('-');
                    const dateObj = new Date(Number(year), Number(month) - 1, 1);
                    const label = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return (
                      <option key={m} value={m}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Type selector */}
              <div className="w-full lg:w-48">
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas as Origens</option>
                  <option value="purchase">🛒 Compras (Shopping List)</option>
                  <option value="manual">✍️ Ajustes de Estoque</option>
                </select>
              </div>

              {/* Reset History Button */}
              {replenishmentLogs.length > 0 && (
                <button
                  onClick={handleClearHistoryConfirm}
                  className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-bold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 self-start lg:self-auto shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Histórico
                </button>
              )}
            </div>
          </div>

          {/* Chronological Logs Feed */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum registro de reposição encontrado.</p>
              <p className="text-slate-400 text-xs mt-1">
                Reposições são geradas automaticamente quando você finaliza compras do mercado ou aumenta o estoque manualmente.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/30">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4 text-right">Quantidade Reposta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
                    {filteredLogs.map(log => {
                      const logDate = new Date(log.date);
                      const formattedDate = logDate.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500 text-[10px]">
                            {formattedDate}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                            {privacyMode ? '••••••' : log.itemName}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[10px]">
                            {log.category || 'Outros'}
                          </td>
                          <td className="py-3 px-4">
                            {log.type === 'purchase' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                                🛒 Compra
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                                ✍️ Ajuste
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            + {privacyMode ? '••' : log.quantityAdded} <span className="text-[10px] text-slate-400 font-bold">{log.unit || 'un'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal - Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {editingItem ? 'Editar Item no Estoque' : 'Novo Item no Estoque'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nome do Item *
                  </label>
                  {selectedRegisteredProduct ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      Vinculado ao Banco de Produtos
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Sincroniza automático com Lista de Compras
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Arroz, Leite, Papel Higiênico..."
                    value={itemName}
                    onFocus={() => setShowProductSuggestions(true)}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setShowProductSuggestions(true);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {showProductSuggestions && productSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                        <span>Sugestões do Banco de Produtos</span>
                        <span>{productSuggestions.length} encontrado(s)</span>
                      </div>
                      {productSuggestions.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSelectProductSuggestion(prod)}
                          className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-white truncate">
                            {prod.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {prod.category && (
                              <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {prod.category}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">
                              {prod.unit || 'un'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Qtd Atual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Unidade</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="un">UN</option>
                    <option value="kg">KG</option>
                    <option value="g">G</option>
                    <option value="cx">CX</option>
                    <option value="pct">PCT</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Categoria</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as ShoppingCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Mínimo para Reposição</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemMinQuantity}
                    onChange={(e) => setItemMinQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemIsMandatory}
                    onChange={(e) => setItemIsMandatory(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <Star className={`w-3.5 h-3.5 ${itemIsMandatory ? "fill-amber-500 text-amber-500" : "text-amber-500"}`} />
                      Item de Compra Obrigatória (Sempre Repor)
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Se marcado, ao lançar para a lista de compras ele sempre aparecerá (mínimo +1 ou a falta total se &gt; 1).
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-3">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">Persistência no Estoque</label>
                <select
                  value={itemPersistedMonths}
                  onChange={(e) => setItemPersistedMonths(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Novo / Sem persistência (&lt; 1 mês)</option>
                  <option value={1}>Persistiu por 1 mês no estoque</option>
                  <option value={2}>Persistiu por 2 meses (Comprar menor %)</option>
                  <option value={3}>Persistiu por 3 ou mais meses (Comprar menor %)</option>
                </select>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1.5 ml-1 font-semibold">
                  * Se persistir por pelo menos 2 meses, a lista de compras recomendará automaticamente comprar uma quantidade menor.
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-xs"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Lançar para Lista de Compras */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Lançar para Lista de Compras
              </h3>
              <button
                type="button"
                onClick={() => setIsLaunchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Selecione para qual mês deseja lançar os itens faltantes:
                </label>
                <select
                  value={selectedLaunchMonth}
                  onChange={(e) => setSelectedLaunchMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {getMonthsFromCurrentYear().map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Prévia de Itens que necessitam de reposição */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60">
                <h4 className="text-xs font-black text-slate-800 dark:text-white mb-3 flex items-center justify-between">
                  <span>Itens para lançamento (faltantes / obrigatórios):</span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {items.filter(i => (Number(i.minQuantity) || 0) > Number(i.quantity || 0) || i.isMandatory).length} item(s)
                  </span>
                </h4>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {items.filter(i => (Number(i.minQuantity) || 0) > Number(i.quantity || 0) || i.isMandatory).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center italic">
                      Todos os seus itens de estoque já atingiram a quantidade ideal e nenhum foi marcado como obrigatório.
                    </p>
                  ) : (
                    items
                      .filter(i => (Number(i.minQuantity) || 0) > Number(i.quantity || 0) || i.isMandatory)
                      .map(item => {
                        const minQty = Number(item.minQuantity) || 0;
                        const currentQty = Number(item.quantity) || 0;
                        const rawMissing = Math.max(0, minQty - currentQty);
                        const neededQty = item.isMandatory ? Math.max(1, rawMissing) : rawMissing;
                        const currentMonthStr = new Date().toISOString().slice(0, 7);

                        const existingInMonth = shoppingList.filter(s => {
                          const sMonth = s.month || currentMonthStr;
                          return (
                            sMonth === selectedLaunchMonth &&
                            s.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                          );
                        });

                        const existingQty = existingInMonth.reduce(
                          (acc, s) => acc + (Number(s.quantity) || 0),
                          0
                        );

                        return (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-slate-800 dark:text-white">
                                  {item.name}
                                </span>
                                {item.isMandatory && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                    Obrigatório
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Em estoque: <b>{currentQty}</b> / Mínimo: <b>{minQty}</b>
                                {item.isMandatory && rawMissing === 0 ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">(Estoque ok, +1 obrigatório)</span>
                                ) : (
                                  <span className="ml-1">(Falta <b>{neededQty} {item.unit}</b>)</span>
                                )}
                              </span>
                            </div>

                            <div className="shrink-0 text-right">
                              {existingQty >= neededQty ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                  Já existe ({existingQty} {item.unit})
                                </span>
                              ) : existingQty === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                                  Lançar: {neededQty} {item.unit}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900/50">
                                  Lançar saldo: +{neededQty - existingQty} {item.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsLaunchModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleLaunchToShoppingList}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Lançar na Lista de Compras
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Resultado do Lançamento */}
      {launchResultModal && launchResultModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Resumo do Lançamento — {launchResultModal.monthLabel}
              </h3>
              <button
                type="button"
                onClick={() => setLaunchResultModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Produtos Adicionados
                  </span>
                  <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                    {launchResultModal.addedCount}
                  </span>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    Já na Lista
                  </span>
                  <span className="text-xl font-black text-amber-800 dark:text-amber-300">
                    {launchResultModal.skippedCount}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 max-h-60 overflow-y-auto space-y-2 text-xs">
                {launchResultModal.messages.map((msg, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 text-slate-700 dark:text-slate-300"
                  >
                    {msg}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setLaunchResultModal(null)}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
