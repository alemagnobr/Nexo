import React from 'react';
import { View } from '../types';
import { ShoppingList } from './ShoppingList';
import { Inventory } from './Inventory';
import { KanbanBoard } from './KanbanBoard';
import { ShoppingCart, Package, Sparkles } from 'lucide-react';

interface ComprasViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const ComprasView: React.FC<ComprasViewProps> = ({
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal
}) => {
  // Logic to finish shopping (Convert cart to expense and update inventory)
  const finishShopping = async (total: number, paymentMethod: string, category: string) => {
     const transaction = {
         description: `Compra de Mercado (${new Date().toLocaleDateString()})`,
         amount: total,
         type: 'expense',
         category: category,
         date: new Date().toISOString().split('T')[0],
         status: 'paid',
         paymentMethod: paymentMethod,
         isRecurring: false
     };

     const shoppingList = data.shoppingList || [];
     const purchasedItems = shoppingList.filter((item: any) => item.isChecked);
     const itemsToProcess = purchasedItems.length > 0 ? purchasedItems : shoppingList;
     const currentInventory = data.inventoryList || [];

     for (const sItem of itemsToProcess) {
         const existing = currentInventory.find(
             (inv: any) => inv.name.trim().toLowerCase() === sItem.name.trim().toLowerCase()
         );

         if (existing) {
             const newQty = (existing.quantity || 0) + (sItem.quantity || 1);
             await actions.updateInventoryItem(existing.id, {
                 quantity: newQty,
                 category: sItem.category || existing.category || 'Outros',
                 unit: sItem.unit || existing.unit || 'un'
             });
         } else {
             await actions.addInventoryItem({
                 name: sItem.name.trim(),
                 quantity: sItem.quantity || 1,
                 unit: sItem.unit || 'un',
                 category: sItem.category || 'Outros',
                 minQuantity: 1
             });
         }

         await actions.addReplenishmentLog({
             itemName: sItem.name.trim(),
             quantityAdded: sItem.quantity || 1,
             unit: sItem.unit || 'un',
             category: sItem.category || 'Outros',
             date: new Date().toISOString(),
             type: 'purchase'
         });
     }

     await actions.addTransaction(transaction);
     await actions.clearShoppingList();
     alert("Compra finalizada! Despesa registrada e itens enviados ao estoque.");
     onNavigate(View.INVENTORY);
  };

  const tabs = [
    {
      id: View.SHOPPING_LIST,
      label: 'Compras',
      icon: ShoppingCart,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100/90 dark:bg-rose-950/80',
      activeBorder: 'border-rose-500/30 text-rose-700 dark:text-rose-300'
    },
    {
      id: View.INVENTORY,
      label: 'Estoque',
      icon: Package,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100/90 dark:bg-indigo-950/80',
      activeBorder: 'border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
    },
    {
      id: View.KANBAN,
      label: 'Nexo Sonhos de Consumo',
      icon: Sparkles,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100/90 dark:bg-purple-950/80',
      activeBorder: 'border-purple-500/30 text-purple-700 dark:text-purple-300'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Sleek Compact Pill Control */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-1 w-max min-w-full md:w-auto p-1 bg-slate-200/60 dark:bg-slate-800/50 backdrop-blur-md rounded-full mx-auto border border-slate-300/60 dark:border-slate-700/60 shadow-sm">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  flex-1 shrink-0 relative flex flex-row items-center justify-center gap-1.5 py-1.5 px-3 md:px-5 rounded-full font-medium transition-all duration-200 cursor-pointer text-xs
                  ${isActive 
                    ? `bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300/60 dark:ring-slate-600 font-semibold` 
                    : `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/40`}
                `}
              >
                <tab.icon className={`w-3.5 h-3.5 shrink-0 ${tab.iconColor}`} />
                <span className="whitespace-nowrap truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.SHOPPING_LIST && (
          <ShoppingList 
             items={data.shoppingList || []}
             registeredProducts={data.registeredProducts || []}
             inventoryList={data.inventoryList || []}
             onAdd={actions.addShoppingItem}
             onUpdate={actions.updateShoppingItem}
             onDelete={actions.deleteShoppingItem}
             onClearList={actions.clearShoppingList}
             onFinishShopping={finishShopping}
             shoppingBudget={data.shoppingBudget}
             onUpdateBudget={actions.setShoppingBudget}
             hasApiKey={hasApiKey}
             privacyMode={privacyMode}
             quickActionSignal={quickActionSignal}
             onAddRegisteredProduct={actions.addRegisteredProduct}
             onAddInventoryItem={actions.addInventoryItem}
             onUpdateInventoryItem={actions.updateInventoryItem}
             onAddReplenishmentLog={actions.addReplenishmentLog}
          />
        )}
        {currentView === View.INVENTORY && (
          <Inventory
             items={data.inventoryList || []}
             replenishmentLogs={data.replenishmentHistory || []}
             shoppingList={data.shoppingList || []}
             registeredProducts={data.registeredProducts || []}
             onAdd={actions.addInventoryItem}
             onUpdate={actions.updateInventoryItem}
             onDelete={actions.deleteInventoryItem}
             onAddReplenishmentLog={actions.addReplenishmentLog}
             onClearReplenishmentHistory={actions.clearReplenishmentHistory}
             onAddToShoppingList={(item) => {
                 actions.addShoppingItem({
                     name: item.name,
                     quantity: item.quantity,
                     unit: item.unit,
                     category: item.category,
                     actualPrice: 0,
                     isChecked: false,
                     observation: 'Auto-gerado para reposição de estoque',
                     month: item.month
                 });
             }}
             onAddRegisteredProduct={actions.addRegisteredProduct}
             onUpdateRegisteredProduct={actions.updateRegisteredProduct}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.KANBAN && (
          <KanbanBoard 
             boards={data.kanbanBoards || []}
             onSaveBoard={actions.saveKanbanBoard}
             onDeleteBoard={actions.deleteKanbanBoard}
             onAddTransaction={(t) => {
                 actions.addTransaction(t);
                 alert('Transação criada a partir do card!');
                 onNavigate(View.TRANSACTIONS);
             }}
             privacyMode={privacyMode}
             investments={data.investments || []}
             onAddInvestment={actions.addInvestment}
             onUpdateInvestment={actions.updateInvestment}
             onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
};
