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

  return (
    <div className="space-y-6">
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
             shoppingCategories={data.shoppingCategories}
             onAddShoppingCategory={actions.addShoppingCategory}
             onDeleteShoppingCategory={actions.deleteShoppingCategory}
             onAddRegisteredProduct={actions.addRegisteredProduct}
             onDeleteRegisteredProduct={actions.deleteRegisteredProduct}
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
             shoppingCategories={data.shoppingCategories}
             onAddShoppingCategory={actions.addShoppingCategory}
             onDeleteShoppingCategory={actions.deleteShoppingCategory}
             onAdd={actions.addInventoryItem}
             onUpdate={actions.updateInventoryItem}
             onDelete={actions.deleteInventoryItem}
             onAddReplenishmentLog={actions.addReplenishmentLog}
             onClearReplenishmentHistory={actions.clearReplenishmentHistory}
             onAddToShoppingList={(item: any) => {
                 actions.addShoppingItem({
                     name: item.name,
                     quantity: item.quantity,
                     unit: item.unit,
                     category: item.category,
                     referencePrice: item.estimatedPrice || item.referencePrice,
                     estimatedPrice: item.estimatedPrice || item.referencePrice,
                     actualPrice: 0,
                     isChecked: false,
                     observation: 'Auto-gerado para reposição de estoque',
                     month: item.month
                 });
             }}
             onAddRegisteredProduct={actions.addRegisteredProduct}
             onUpdateRegisteredProduct={actions.updateRegisteredProduct}
             onDeleteRegisteredProduct={actions.deleteRegisteredProduct}
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
