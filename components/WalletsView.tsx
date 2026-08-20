import React, { useState, useMemo } from 'react';
import { Wallet, WalletType, Transaction, Category, PaymentMethod } from '../types';
import { Plus, Trash2, Pencil, Landmark, CreditCard, Banknote, MoreHorizontal, CheckCircle, X, ChevronDown, ChevronUp, ArrowRightLeft, AlertCircle, Utensils, Wallet as WalletIcon, Save, ArrowDownCircle, PlusCircle, ArrowUpCircle, Calendar, Clock, Layers } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';

interface WalletsViewProps {
  wallets: Wallet[];
  transactions?: Transaction[];
  categories?: Category[];
  onAdd: (wallet: Omit<Wallet, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Wallet>) => void;
  onDelete: (id: string, migrateToWalletId?: string) => void;
  onTransfer?: (sourceWalletId: string, targetWalletId: string, amount: number, date: string, observation?: string) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
}

export const getCreditCardMetrics = (wallet: Wallet, transactions: Transaction[] = []) => {
  const creditLimit = wallet.creditLimit || 0;
  const availableBalance = wallet.balance || 0;
  const totalUsed = Math.max(0, creditLimit - availableBalance);
  return {
    creditLimit,
    initialUsed: totalUsed,
    txsSpent: 0,
    totalUsed,
    availableBalance
  };
};

export const getDefaultNextDueDate = (dueDay?: number): string => {
  const day = dueDay || 10;
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth(); // 0-indexed
  
  if (today.getDate() > day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  
  const formattedMonth = String(month + 1).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  return `${year}-${formattedMonth}-${formattedDay}`;
};

export const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const WALLET_TYPES: { value: WalletType; label: string; icon: any }[] = [
  { value: WalletType.BANK, label: 'Conta Bancária', icon: Landmark },
  { value: WalletType.CREDIT_CARD, label: 'Cartão de Crédito', icon: CreditCard },
  { value: WalletType.MEAL_TICKET, label: 'Vale Refeição/Alimentação', icon: Banknote },
  { value: WalletType.OTHER, label: 'Outro', icon: MoreHorizontal },
];

const COLORS = ['slate', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

export const getCardGradient = (color: string = 'blue') => {
  const chosenColor = color === 'black' || !color ? 'blue' : color;
  switch (chosenColor) {
    case 'blue':
      return {
        cardBg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white border-blue-400/30 shadow-blue-900/20',
        badgeBg: 'bg-blue-400/20 text-blue-100 border-blue-300/30',
        glowBg: 'bg-blue-400/20',
        iconBg: 'bg-blue-500/30 text-blue-100',
      };
    case 'emerald':
      return {
        cardBg: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white border-emerald-400/30 shadow-emerald-900/20',
        badgeBg: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30',
        glowBg: 'bg-emerald-400/20',
        iconBg: 'bg-emerald-500/30 text-emerald-100',
      };
    case 'purple':
    case 'violet':
      return {
        cardBg: 'bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-950 text-white border-purple-400/30 shadow-purple-900/20',
        badgeBg: 'bg-purple-400/20 text-purple-100 border-purple-300/30',
        glowBg: 'bg-purple-400/20',
        iconBg: 'bg-purple-500/30 text-purple-100',
      };
    case 'rose':
    case 'red':
      return {
        cardBg: 'bg-gradient-to-br from-rose-600 via-red-700 to-rose-950 text-white border-rose-400/30 shadow-rose-900/20',
        badgeBg: 'bg-rose-400/20 text-rose-100 border-rose-300/30',
        glowBg: 'bg-rose-400/20',
        iconBg: 'bg-rose-500/30 text-rose-100',
      };
    case 'amber':
    case 'orange':
      return {
        cardBg: 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-900 text-white border-amber-400/30 shadow-amber-900/20',
        badgeBg: 'bg-amber-400/20 text-amber-100 border-amber-300/30',
        glowBg: 'bg-amber-400/20',
        iconBg: 'bg-amber-500/30 text-amber-100',
      };
    case 'teal':
    case 'cyan':
      return {
        cardBg: 'bg-gradient-to-br from-teal-600 via-cyan-700 to-teal-950 text-white border-teal-400/30 shadow-teal-900/20',
        badgeBg: 'bg-teal-400/20 text-teal-100 border-teal-300/30',
        glowBg: 'bg-teal-400/20',
        iconBg: 'bg-teal-500/30 text-teal-100',
      };
    case 'fuchsia':
    case 'pink':
      return {
        cardBg: 'bg-gradient-to-br from-fuchsia-600 via-pink-700 to-purple-950 text-white border-fuchsia-400/30 shadow-fuchsia-900/20',
        badgeBg: 'bg-fuchsia-400/20 text-fuchsia-100 border-fuchsia-300/30',
        glowBg: 'bg-fuchsia-400/20',
        iconBg: 'bg-fuchsia-500/30 text-fuchsia-100',
      };
    case 'slate':
      return {
        cardBg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white border-slate-600 shadow-slate-900/20',
        badgeBg: 'bg-slate-600/40 text-slate-200 border-slate-500/30',
        glowBg: 'bg-slate-400/10',
        iconBg: 'bg-slate-600/40 text-slate-200',
      };
    case 'indigo':
    default:
      return {
        cardBg: 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-950 text-white border-indigo-400/30 shadow-indigo-900/20',
        badgeBg: 'bg-indigo-400/20 text-indigo-100 border-indigo-300/30',
        glowBg: 'bg-indigo-400/20',
        iconBg: 'bg-indigo-500/30 text-indigo-100',
      };
  }
};

export const WalletsView: React.FC<WalletsViewProps> = ({ wallets, transactions = [], categories = [], onAdd, onUpdate, onDelete, onTransfer, onUpdateTransaction, onAddTransaction }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string>('');
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [migrateTargetWalletId, setMigrateTargetWalletId] = useState<string>('');

  // "Usar Saldo" Modal State
  const [usingBalanceWallet, setUsingBalanceWallet] = useState<Wallet | null>(null);
  const [useExpenseDesc, setUseExpenseDesc] = useState('');
  const [useExpenseAmount, setUseExpenseAmount] = useState<number>(0);
  const [useExpenseCategory, setUseExpenseCategory] = useState<string>('Outros');
  const [useExpenseDate, setUseExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [useExpensePaymentMethod, setUseExpensePaymentMethod] = useState<PaymentMethod>('debit_card');
  const [useExpenseObs, setUseExpenseObs] = useState<string>('');
  const [useExpenseError, setUseExpenseError] = useState<string>('');

  // "Inserir Benefício" Modal State
  const [addingBenefitWallet, setAddingBenefitWallet] = useState<Wallet | null>(null);
  const [benefitDesc, setBenefitDesc] = useState('');
  const [benefitAmount, setBenefitAmount] = useState<number>(0);
  const [benefitCategory, setBenefitCategory] = useState<string>('Benefícios');
  const [benefitDate, setBenefitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [benefitObs, setBenefitObs] = useState<string>('');
  const [benefitError, setBenefitError] = useState<string>('');

  const incomeCategories = useMemo(() => {
    const list = (categories || []).filter(c => c.type === 'income').map(c => c.name);
    if (list.length > 0) return list;
    return ['Benefícios', 'Salário', 'Rendimentos', 'Outros'];
  }, [categories]);

  const handleStartAddBenefit = (wallet: Wallet) => {
    setAddingBenefitWallet(wallet);
    setBenefitDesc(`Recarga Benefício - ${wallet.name}`);
    setBenefitAmount(0);
    setBenefitCategory(incomeCategories.includes('Benefícios') ? 'Benefícios' : (incomeCategories[0] || 'Outros'));
    setBenefitDate(new Date().toISOString().split('T')[0]);
    setBenefitObs('');
    setBenefitError('');
  };

  const handleAddBenefitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingBenefitWallet || !onAddTransaction) return;

    if (!benefitDesc.trim()) {
      setBenefitError('Informe a descrição do benefício.');
      return;
    }

    if (benefitAmount <= 0) {
      setBenefitError('O valor do benefício deve ser maior que zero.');
      return;
    }

    try {
      const newTx: Omit<Transaction, 'id'> = {
        description: benefitDesc.trim(),
        amount: benefitAmount,
        type: 'income',
        category: benefitCategory || 'Benefícios',
        date: benefitDate,
        status: 'paid', // Marcando concluído pois já caiu na conta/cartão
        paymentMethod: addingBenefitWallet.type === WalletType.CREDIT_CARD ? 'credit_card' : 'pix',
        walletId: addingBenefitWallet.id,
        observation: benefitObs.trim() || undefined,
        isRecurring: false,
        autoPay: false
      };

      await onAddTransaction(newTx);

      setAddingBenefitWallet(null);
      setBenefitDesc('');
      setBenefitAmount(0);
      setBenefitObs('');
      setBenefitError('');
    } catch (err: any) {
      setBenefitError(err.message || 'Erro ao registrar benefício.');
    }
  };

  const expenseCategories = useMemo(() => {
    const list = (categories || []).filter(c => c.type === 'expense').map(c => c.name);
    if (list.length > 0) return list;
    return [
      'Alimentação',
      'Hortifruti',
      'Carnes',
      'Laticínios',
      'Mercearia',
      'Padaria',
      'Bebidas',
      'Limpeza',
      'Higiene',
      'Restaurante / Lazer',
      'Transporte',
      'Moradia',
      'Saúde',
      'Outros'
    ];
  }, [categories]);

  const handleStartUseBalance = (wallet: Wallet) => {
    setUsingBalanceWallet(wallet);
    setUseExpenseDesc('');
    setUseExpenseAmount(0);
    setUseExpenseCategory(expenseCategories[0] || 'Alimentação');
    setUseExpenseDate(new Date().toISOString().split('T')[0]);

    if (wallet.type === WalletType.CREDIT_CARD) {
      setUseExpensePaymentMethod('credit_card');
    } else if (wallet.type === WalletType.BANK) {
      setUseExpensePaymentMethod('debit_card');
    } else if (wallet.type === WalletType.MEAL_TICKET) {
      setUseExpensePaymentMethod('debit_card');
    } else {
      setUseExpensePaymentMethod('pix');
    }

    setUseExpenseObs('');
    setUseExpenseError('');
  };

  const handleUseBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingBalanceWallet || !onAddTransaction) return;

    if (!useExpenseDesc.trim()) {
      setUseExpenseError('Informe a descrição da despesa.');
      return;
    }

    if (useExpenseAmount <= 0) {
      setUseExpenseError('O valor da despesa deve ser maior que zero.');
      return;
    }

    if (useExpenseAmount > usingBalanceWallet.balance + 0.001) {
      setUseExpenseError(`Transação não permitida: A conta ou cartão "${usingBalanceWallet.name}" não possui margem/saldo suficiente. Disponível: ${formatCurrency(usingBalanceWallet.balance)}`);
      return;
    }

    try {
      const newTx: Omit<Transaction, 'id'> = {
        description: useExpenseDesc.trim(),
        amount: useExpenseAmount,
        type: 'expense',
        category: useExpenseCategory || 'Outros',
        date: useExpenseDate,
        status: 'paid', // Marcando concluído pois já foi debitado
        paymentMethod: useExpensePaymentMethod,
        walletId: usingBalanceWallet.id,
        observation: useExpenseObs.trim() || undefined,
        isRecurring: false,
        autoPay: false
      };

      await onAddTransaction(newTx);

      setUsingBalanceWallet(null);
      setUseExpenseDesc('');
      setUseExpenseAmount(0);
      setUseExpenseObs('');
      setUseExpenseError('');
    } catch (err: any) {
      setUseExpenseError(err.message || 'Erro ao registrar despesa.');
    }
  };
  
  const totals = useMemo(() => {
    return wallets.reduce(
      (acc, wallet) => {
        if (wallet.type === WalletType.BANK) acc.bank += wallet.balance;
        else if (wallet.type === WalletType.CREDIT_CARD) {
          const metrics = getCreditCardMetrics(wallet, transactions);
          acc.credit += metrics.availableBalance;
        }
        else if (wallet.type === WalletType.MEAL_TICKET) acc.meal += wallet.balance;
        else if (wallet.type === WalletType.OTHER) acc.other += wallet.balance;
        return acc;
      },
      { bank: 0, credit: 0, meal: 0, other: 0 }
    );
  }, [wallets, transactions]);

  const creditCardsSummaries = useMemo(() => {
    const allCreditCards = wallets.filter(w => w.type === WalletType.CREDIT_CARD);
    
    return allCreditCards.map(card => {
       const cardTransactions = (transactions || []).filter(t => t.walletId === card.id && t.type === 'expense');
       const nextDue = card.nextDueDate || getDefaultNextDueDate(card.creditCardDueDate);
       
       let currentInvoiceSum = 0;
       if (card.lastPaymentDate) {
         currentInvoiceSum = cardTransactions
           .filter(t => t.date > card.lastPaymentDate! && t.date <= nextDue)
           .reduce((acc, t) => acc + t.amount, 0);
       } else {
         const nextDueDateObj = new Date(nextDue + 'T12:00:00');
         const cycleStartYear = nextDueDateObj.getMonth() === 0 ? nextDueDateObj.getFullYear() - 1 : nextDueDateObj.getFullYear();
         const cycleStartMonth = nextDueDateObj.getMonth() === 0 ? 11 : nextDueDateObj.getMonth() - 1;
         const cycleStartDateObj = new Date(cycleStartYear, cycleStartMonth, nextDueDateObj.getDate());
         const cycleStartDateStr = cycleStartDateObj.toISOString().split('T')[0];
         
         currentInvoiceSum = cardTransactions
           .filter(t => t.date > cycleStartDateStr && t.date <= nextDue)
           .reduce((acc, t) => acc + t.amount, 0);
       }

       return {
         ...card,
         currentInvoice: currentInvoiceSum
       };
    });
  }, [wallets, transactions]);

  const otherWallets = useMemo(() => wallets.filter(w => w.type !== WalletType.CREDIT_CARD && w.type !== WalletType.MEAL_TICKET), [wallets]);

  const mealTickets = useMemo(() => wallets.filter(w => w.type === WalletType.MEAL_TICKET), [wallets]);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string>('');
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferObs, setTransferObs] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  const [payingCard, setPayingCard] = useState<(Wallet & { currentInvoice: number }) | null>(null);
  const [paymentWalletId, setPaymentWalletId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNextDueDate, setPaymentNextDueDate] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');

  const calculateDefaultNextDueDate = (card: Wallet) => {
    const currentDue = card.nextDueDate || getDefaultNextDueDate(card.creditCardDueDate);
    const currentDueObj = new Date(currentDue + 'T12:00:00');
    
    let nextYear = currentDueObj.getFullYear();
    let nextMonth = currentDueObj.getMonth() + 1; // Próximo mês
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    
    const day = currentDueObj.getDate();
    const formattedMonth = String(nextMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${nextYear}-${formattedMonth}-${formattedDay}`;
  };

  const handleStartPayInvoice = (card: Wallet & { currentInvoice: number }) => {
    setPayingCard(card);
    const bankWallet = wallets.find(w => w.type === WalletType.BANK);
    setPaymentWalletId(bankWallet ? bankWallet.id : '');
    setPaymentAmount(card.currentInvoice);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNextDueDate(calculateDefaultNextDueDate(card));
    setPaymentError('');
  };

  const handlePayInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard || !onAddTransaction) return;
    
    if (!paymentWalletId) {
      setPaymentError('Selecione uma conta bancária de origem para o pagamento.');
      return;
    }
    
    if (paymentAmount <= 0) {
      setPaymentError('O valor de pagamento deve ser maior que zero.');
      return;
    }

    const payingWallet = wallets.find(w => w.id === paymentWalletId);
    if (payingWallet && paymentAmount > payingWallet.balance + 0.001) {
      setPaymentError(`Transação não permitida: A conta "${payingWallet.name}" não possui saldo suficiente. Disponível: ${formatCurrency(payingWallet.balance)}`);
      return;
    }

    try {
      const paymentTx: Omit<Transaction, 'id'> = {
        description: `Pagamento Fatura ${payingCard.name}`,
        amount: paymentAmount,
        type: 'expense',
        category: 'Pagamento de Cartão',
        date: paymentDate,
        status: 'paid',
        paymentMethod: 'pix',
        walletId: paymentWalletId,
        observation: `Fatura paga com vencimento original em ${payingCard.nextDueDate ? formatDateDMY(payingCard.nextDueDate) : formatDateDMY(getDefaultNextDueDate(payingCard.creditCardDueDate))}`,
        isRecurring: false,
        autoPay: false
      };
      
      await onAddTransaction(paymentTx);
      
      const currentLimit = payingCard.creditLimit || 0;
      const newBalance = Math.min(currentLimit, (payingCard.balance || 0) + paymentAmount);
      
      await onUpdate(payingCard.id, {
        lastPaymentDate: paymentDate,
        nextDueDate: paymentNextDueDate,
        balance: newBalance
      });
      
      setPayingCard(null);
      setPaymentWalletId('');
      setPaymentAmount(0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNextDueDate('');
      setPaymentError('');
    } catch (err: any) {
      setPaymentError(err.message || 'Erro ao processar pagamento de fatura.');
    }
  };

  // --- LAUNCH CLOSED INVOICE EXPENSE ON DUE DATE ---
  const [launchingInvoiceCard, setLaunchingInvoiceCard] = useState<(Wallet & { currentInvoice: number }) | null>(null);
  const [launchInvoiceAmount, setLaunchInvoiceAmount] = useState<number>(0);
  const [launchInvoiceDueDate, setLaunchInvoiceDueDate] = useState<string>('');
  const [launchInvoiceWalletId, setLaunchInvoiceWalletId] = useState<string>('');
  const [launchInvoicePaymentMethod, setLaunchInvoicePaymentMethod] = useState<PaymentMethod>('boleto');
  const [launchInvoiceAutoPay, setLaunchInvoiceAutoPay] = useState<boolean>(false);
  const [launchInvoiceCategory, setLaunchInvoiceCategory] = useState<string>('Pagamento de Cartão');
  const [launchInvoiceObs, setLaunchInvoiceObs] = useState<string>('');
  const [launchInvoiceError, setLaunchInvoiceError] = useState<string>('');

  // --- MANAGING CREDIT CARD INSTALLMENTS ---
  const [managingInstallmentsCard, setManagingInstallmentsCard] = useState<Wallet | null>(null);

  const handleStartLaunchInvoice = (card: Wallet & { currentInvoice: number }) => {
    setLaunchingInvoiceCard(card);
    setLaunchInvoiceAmount(card.currentInvoice);
    const nextDue = card.nextDueDate || getDefaultNextDueDate(card.creditCardDueDate);
    setLaunchInvoiceDueDate(nextDue);
    const bankWallet = wallets.find(w => w.type === WalletType.BANK);
    setLaunchInvoiceWalletId(bankWallet ? bankWallet.id : '');
    setLaunchInvoicePaymentMethod('boleto');
    setLaunchInvoiceAutoPay(false);
    setLaunchInvoiceCategory('Pagamento de Cartão');
    setLaunchInvoiceObs(`Fatura fechada do cartão ${card.name} - Vencimento ${formatDateDMY(nextDue)}`);
    setLaunchInvoiceError('');
  };

  const handleLaunchInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchingInvoiceCard || !onAddTransaction) return;

    if (launchInvoiceAmount <= 0) {
      setLaunchInvoiceError('O valor da fatura deve ser maior que zero.');
      return;
    }

    if (!launchInvoiceDueDate) {
      setLaunchInvoiceError('Informe a data de vencimento da fatura.');
      return;
    }

    try {
      const invoiceTx: Omit<Transaction, 'id'> = {
        description: `Fatura ${launchingInvoiceCard.name}`,
        amount: launchInvoiceAmount,
        type: 'expense',
        category: launchInvoiceCategory || 'Pagamento de Cartão',
        date: launchInvoiceDueDate, // DATA DE VENCIMENTO DA FATURA
        status: 'pending', // PENDENTE NA DATA DE VENCIMENTO
        paymentMethod: launchInvoicePaymentMethod,
        walletId: launchInvoiceWalletId || undefined,
        observation: launchInvoiceObs,
        autoPay: launchInvoiceAutoPay,
        isRecurring: false
      };

      await onAddTransaction(invoiceTx);

      setLaunchingInvoiceCard(null);
      setLaunchInvoiceAmount(0);
      setLaunchInvoiceDueDate('');
      setLaunchInvoiceObs('');
      setLaunchInvoiceError('');
    } catch (err: any) {
      setLaunchInvoiceError(err.message || 'Erro ao lançar despesa da fatura.');
    }
  };

  const cardInstallmentGroups = useMemo(() => {
    if (!managingInstallmentsCard || !transactions) return [];

    const cardTxs = transactions.filter(t => 
      (t.walletId === managingInstallmentsCard.id || t.paymentMethod === 'credit_card') &&
      t.type === 'expense'
    );

    const groupsMap = new Map<string, Transaction[]>();

    cardTxs.forEach(t => {
      const instMatch = t.description.match(/(.+?)\s*\((\d+)\/(\d+)\)/);
      const key = t.groupId || (instMatch ? instMatch[1].trim() : null);

      if (key) {
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(t);
      }
    });

    const result = [];
    for (const [key, txs] of groupsMap.entries()) {
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let totalInstallments = txs.length;
      let baseName = key;
      const firstMatch = txs[0].description.match(/(.+?)\s*\((\d+)\/(\d+)\)/);
      if (firstMatch) {
        baseName = firstMatch[1].trim();
        totalInstallments = parseInt(firstMatch[3]) || txs.length;
      }

      const totalAmount = txs.reduce((acc, t) => acc + t.amount, 0);
      const paidTxs = txs.filter(t => t.status === 'paid');
      const paidCount = paidTxs.length;
      const paidAmount = paidTxs.reduce((acc, t) => acc + t.amount, 0);
      const remainingAmount = totalAmount - paidAmount;

      result.push({
        groupId: key,
        title: baseName,
        txs,
        totalInstallments,
        paidCount,
        totalAmount,
        paidAmount,
        remainingAmount
      });
    }

    return result;
  }, [managingInstallmentsCard, transactions]);
  
  const [formData, setFormData] = useState<Omit<Wallet, 'id'>>({
    name: '',
    type: WalletType.BANK,
    balance: 0,
    color: 'indigo',
    observation: ''
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      type: WalletType.BANK, 
      balance: 0, 
      color: 'indigo', 
      observation: '', 
      creditCardDueDate: undefined, 
      creditLimit: undefined,
      initialUsed: undefined
    });
    setEditingId(null);
    setIsFormOpen(false);
    setWalletError('');
  };

  const handleEdit = (wallet: Wallet) => {
    const isCredit = wallet.type === WalletType.CREDIT_CARD;
    const currentUsed = isCredit
      ? Math.max(0, (wallet.creditLimit || 0) - (wallet.balance || 0))
      : 0;
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      color: wallet.color || 'indigo',
      icon: wallet.icon,
      observation: wallet.observation || '',
      creditCardDueDate: wallet.creditCardDueDate,
      creditLimit: wallet.creditLimit,
      initialUsed: isCredit ? currentUsed : wallet.initialUsed
    });
    setEditingId(wallet.id);
    setIsFormOpen(true);
    setWalletError('');
  };

  const handleDelete = (id: string) => {
    const hasLinkedTransactions = transactions.some(t => t.walletId === id);
    if (hasLinkedTransactions) {
      const otherAvailableWallets = wallets.filter(w => w.id !== id);
      if (otherAvailableWallets.length === 0) {
        setWalletError('Não é possível excluir esta conta pois existem transações vinculadas a ela e não há outra conta para transferi-las. Por favor, crie outra conta primeiro.');
        setTimeout(() => setWalletError(''), 7000);
        return;
      }
      
      setWalletToDelete(id);
      setMigrateTargetWalletId(otherAvailableWallets[0].id);
      setWalletError('');
      return;
    }
    setWalletError('');
    onDelete(id);
  };

  const handleConfirmDeleteWithMigration = async () => {
    if (!walletToDelete || !migrateTargetWalletId) return;
    
    onDelete(walletToDelete, migrateTargetWalletId);
    setWalletToDelete(null);
    setMigrateTargetWalletId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let dataToSave = { ...formData };
    if (formData.type === WalletType.CREDIT_CARD) {
      const limit = formData.creditLimit || 0;
      const used = formData.initialUsed || 0;
      dataToSave.balance = limit - used;
    }
    if (editingId) {
      onUpdate(editingId, dataToSave);
    } else {
      onAdd(dataToSave);
    }
    resetForm();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (transferAmount <= 0) {
      setTransferError('O valor da transferência deve ser maior que zero.');
      return;
    }
    
    if (transferSourceId === transferTargetId) {
      setTransferError('A conta de destino deve ser diferente da conta de origem.');
      return;
    }
    
    const sourceWallet = wallets.find(w => w.id === transferSourceId);
    if (sourceWallet && transferAmount > sourceWallet.balance) {
      setTransferError('Saldo insuficiente para esta transferência.');
      return;
    }
    
    if (onTransfer && transferSourceId && transferTargetId && transferAmount > 0) {
      onTransfer(transferSourceId, transferTargetId, transferAmount, transferDate, transferObs);
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferObs('');
      setTransferTargetId('');
      setTransferError('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-500" />
              Minhas Contas
            </h2>
            {isExpanded && <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie seus bancos, cartões e vales.</p>}
          </div>
        </div>
        {!isFormOpen && isExpanded && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-bold text-xs"
          >
            <Plus className="w-3 h-3" /> Nova Conta
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {isFormOpen && (
            <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
              <div className="flex min-h-full items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 animate-scale-in border border-slate-200 dark:border-slate-700 relative">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur z-20">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                    {editingId ? 'Editar Conta' : 'Nova Conta'}
                  </h3>
                  <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 md:p-6 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Conta</label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Nubank, Itaú, Vale Refeição"
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                        <select
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value as WalletType })}
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {WALLET_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {formData.type === WalletType.CREDIT_CARD ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Limite Total do Cartão
                            </label>
                            <CurrencyInput
                              required
                              value={formData.creditLimit || 0}
                              onChangeValue={val => {
                                const lim = parseFloat(val) || 0;
                                setFormData(prev => ({
                                  ...prev,
                                  creditLimit: lim,
                                  balance: lim - (prev.initialUsed || 0)
                                }));
                              }}
                              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Valor Atual Usado / Fatura
                            </label>
                            <CurrencyInput
                              value={formData.initialUsed || 0}
                              onChangeValue={val => {
                                const used = parseFloat(val) || 0;
                                setFormData(prev => ({
                                  ...prev,
                                  initialUsed: used,
                                  balance: (prev.creditLimit || 0) - used
                                }));
                              }}
                              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Valor atualmente usado do limite. Se você zerar (0,00), a fatura/uso fica zerada e o limite fica 100% disponível.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saldo Atual</label>
                          <CurrencyInput
                            required
                            value={formData.balance}
                            onChangeValue={val => setFormData({ ...formData, balance: parseFloat(val) || 0 })}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações (Opcional)</label>
                        <textarea
                          value={formData.observation || ''}
                          onChange={e => setFormData({ ...formData, observation: e.target.value })}
                          placeholder="Ex: Cartão vence dia 10, conta conjunta..."
                          className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, color })}
                              className={`w-8 h-8 rounded-full bg-${color}-500 flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800 scale-110' : ''}`}
                            >
                              {formData.color === color && <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-white/95 dark:bg-slate-800/95 pt-4 pb-2 border-t border-slate-100 dark:border-slate-700 z-10 w-full -mx-4 -mb-4 px-4 md:-mx-6 md:-mb-6 md:px-6">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingId ? 'Salvar Alterações' : 'Criar Conta'}
                      </button>
                    </div>
                  </form>
                </div>
               </div>
              </div>
            </div>
          )}

      {walletError && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium flex items-start gap-2 mb-4 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{walletError}</p>
        </div>
      )}

      {isExpanded && !isFormOpen && (
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20">
                <Landmark className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Contas</span>
                <span className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.bank)}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20">
                <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Cartões</span>
                <span className="text-lg md:text-xl font-bold text-slate-600 dark:text-slate-300 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.credit)}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-500/20">
                <Utensils className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Alimentação</span>
                <span className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.meal)}
                </span>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-600/50">
                <MoreHorizontal className="w-5 h-5 md:w-6 md:h-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">Outros</span>
                <span className="text-lg md:text-xl font-bold text-slate-600 dark:text-slate-300 leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.other)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
         <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-3">
            <Landmark className="w-4 h-4 text-slate-500" /> Contas e Cartões
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wallets.map(wallet => {
              const isCreditCard = wallet.type === WalletType.CREDIT_CARD;
              const isMealTicket = wallet.type === WalletType.MEAL_TICKET;
              const isBank = wallet.type === WalletType.BANK;

              const creditSummary = isCreditCard 
                ? creditCardsSummaries.find(c => c.id === wallet.id) 
                : null;
                
              const currentInvoice = creditSummary?.currentInvoice || 0;
              const nextDue = wallet.nextDueDate || getDefaultNextDueDate(wallet.creditCardDueDate);

              // Get card gradient based on user's selected color (defaults to indigo for credit cards, blue for bank accounts)
              const cardColor = wallet.color || (isCreditCard ? 'indigo' : isMealTicket ? 'amber' : 'blue');
              const gradient = getCardGradient(cardColor);

              const TypeIcon = WALLET_TYPES.find(t => t.value === wallet.type)?.icon || Landmark;
              const typeLabel = isBank ? 'Conta Bancária' : isCreditCard ? 'Cartão de Crédito' : isMealTicket ? 'Vale Refeição' : 'Outra Conta';

              return (
                <div 
                  key={wallet.id} 
                  className={`${gradient.cardBg} p-4 rounded-2xl shadow-lg relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between min-h-[190px] border`}
                >
                  {/* Glowing background blur */}
                  <div className={`absolute -right-12 -top-12 w-36 h-36 ${gradient.glowBg} rounded-full blur-2xl pointer-events-none`} />

                  {/* Top Header */}
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl backdrop-blur-md shadow-inner text-white ${gradient.iconBg}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border w-fit ${gradient.badgeBg}`}>
                          {typeLabel}
                        </span>
                        <h3 className="font-bold text-white text-sm truncate max-w-[140px] mt-0.5" title={wallet.name}>
                          {wallet.name}
                        </h3>
                      </div>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTransfer && (
                        <button 
                          onClick={() => {
                            setTransferSourceId(wallet.id);
                            setTransferTargetId('');
                            setTransferAmount(0);
                            setTransferDate(new Date().toISOString().split('T')[0]);
                            setTransferObs('');
                            setTransferError('');
                            setIsTransferModalOpen(true);
                          }} 
                          className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" 
                          title="Transferir"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(wallet)} 
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors" 
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(wallet.id)} 
                        className="p-1.5 text-white/80 hover:text-rose-200 hover:bg-rose-500/30 rounded-lg transition-colors" 
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body: Balance */}
                  <div className="relative z-10 my-auto py-1">
                    <div>
                      <p className="text-[10px] text-white/75 uppercase font-semibold tracking-wider">
                        {isCreditCard ? 'Saldo Disponível (Limite)' : 'Saldo Disponível'}
                      </p>
                      <p className="text-xl font-black text-white tracking-tight">
                        {formatCurrency(isCreditCard ? getCreditCardMetrics(wallet, transactions).availableBalance : wallet.balance)}
                      </p>
                    </div>

                    {isCreditCard && (() => {
                      const metrics = getCreditCardMetrics(wallet, transactions);
                      return (
                        <div className="mt-2 pt-1.5 border-t border-white/15 text-[10px] text-white/85 space-y-0.5">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white/70">Limite Total:</span>
                            <span>{formatCurrency(metrics.creditLimit)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-white/70">Valor Usado:</span>
                            <span>{formatCurrency(metrics.totalUsed)}</span>
                          </div>
                          {metrics.creditLimit > 0 && (
                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-white rounded-full transition-all" 
                                style={{ width: `${Math.min(100, Math.max(0, (metrics.totalUsed / metrics.creditLimit) * 100))}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {wallet.observation && (
                      <p className="text-[10px] text-white/70 mt-1 line-clamp-1 italic">
                        {wallet.observation}
                      </p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  {onAddTransaction && (
                    <div className="mt-2 pt-2 border-t border-white/15 flex flex-col gap-1.5 relative z-10">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartUseBalance(wallet)}
                          className="py-1.5 px-2 bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                          title="Lançar despesa e debitar desta conta/cartão"
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5 text-white shrink-0" />
                          Usar saldo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartAddBenefit(wallet)}
                          className="py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                          title="Registrar recarga / entrada de dinheiro nesta conta/cartão"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-white shrink-0" />
                          {isMealTicket ? 'Benefício' : 'Recarga'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
         </div>
      </div>
      
      {wallets.length === 0 && !isFormOpen && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-center">
          <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhuma conta</h3>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-bold text-xs shadow-sm mt-2"
          >
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
      )}
        </>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Nova Transferência</h3>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {transferError && (
              <div className="mx-4 mt-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-sm font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{transferError}</p>
              </div>
            )}
            
            <form onSubmit={handleTransferSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conta de Origem</label>
                <div className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-xl p-3 opacity-70 flex justify-between items-center">
                  <span>{wallets.find(w => w.id === transferSourceId)?.name || 'Conta não encontrada'}</span>
                  <span className="font-bold text-sm">
                    Saldo: {formatCurrency(wallets.find(w => w.id === transferSourceId)?.balance || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conta de Destino</label>
                <select
                  required
                  value={transferTargetId}
                  onChange={e => setTransferTargetId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione a conta de destino</option>
                  {wallets.filter(w => w.id !== transferSourceId).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor</label>
                <CurrencyInput
                  required
                  value={transferAmount || ''}
                  onChangeValue={val => setTransferAmount(parseFloat(val) || 0)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                <input
                  required
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação (Opcional)</label>
                <input
                  type="text"
                  value={transferObs}
                  onChange={e => setTransferObs(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Transferência para reserva"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!transferTargetId || transferAmount <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Deletion & Transaction Migration Modal */}
      {walletToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-rose-50/50 dark:bg-rose-950/10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Migrar Transações e Excluir</h3>
              </div>
              <button 
                onClick={() => {
                  setWalletToDelete(null);
                  setMigrateTargetWalletId('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                A conta <strong className="text-slate-800 dark:text-white">"{wallets.find(w => w.id === walletToDelete)?.name}"</strong> possui <strong className="text-rose-600 dark:text-rose-400">{transactions.filter(t => t.walletId === walletToDelete).length} transações</strong> vinculadas a ela.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Para prosseguir com a exclusão, selecione para qual conta deseja transferir estas transações:
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conta de Destino</label>
                <select
                  required
                  value={migrateTargetWalletId}
                  onChange={e => setMigrateTargetWalletId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                >
                  {wallets.filter(w => w.id !== walletToDelete).map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Saldo: {formatCurrency(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWalletToDelete(null);
                    setMigrateTargetWalletId('');
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteWithMigration}
                  disabled={!migrateTargetWalletId}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  Transferir e Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento de Fatura do Cartão */}
      {payingCard && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Pagar Fatura</h3>
              </div>
              <button 
                type="button"
                onClick={() => setPayingCard(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayInvoiceSubmit} className="p-4 space-y-4">
              {paymentError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{paymentError}</p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cartão</span>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{payingCard.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total em Aberto</span>
                  <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
                    {formatCurrency(payingCard.currentInvoice)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conta Bancária de Origem</label>
                <select
                  required
                  value={paymentWalletId}
                  onChange={e => setPaymentWalletId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  <option value="">Selecione a conta bancária para débito</option>
                  {wallets.filter(w => w.type === WalletType.BANK || w.type === WalletType.OTHER).map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor do Pagamento</label>
                <CurrencyInput
                  required
                  value={paymentAmount || ''}
                  onChangeValue={val => setPaymentAmount(parseFloat(val) || 0)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Data do Pagamento</label>
                  <input
                    required
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1" title="Nova data de vencimento inteligente da fatura">Nova Data Vencimento</label>
                  <input
                    required
                    type="date"
                    value={paymentNextDueDate}
                    onChange={e => setPaymentNextDueDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPayingCard(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!paymentWalletId || paymentAmount <= 0}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/15"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usar Saldo Modal */}
      {usingBalanceWallet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto animate-scale-in border border-slate-200 dark:border-slate-700">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600 dark:text-rose-400 block">
                    Nova Despesa (Débito Direto)
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight">
                    Usar Saldo: <span className="text-indigo-600 dark:text-indigo-400">{usingBalanceWallet.name}</span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsingBalanceWallet(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance Banner */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 px-6 py-3 border-b border-indigo-100 dark:border-indigo-900/40 flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {usingBalanceWallet.type === WalletType.CREDIT_CARD ? 'Limite Disponível:' : 'Saldo Atual:'}
              </span>
              <span className="font-extrabold text-sm text-indigo-700 dark:text-indigo-300">
                {formatCurrency(usingBalanceWallet.type === WalletType.CREDIT_CARD ? getCreditCardMetrics(usingBalanceWallet, transactions).availableBalance : usingBalanceWallet.balance)}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleUseBalanceSubmit} className="p-4 md:p-6 space-y-4">
              {useExpenseError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{useExpenseError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Descrição da Despesa <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={useExpenseDesc}
                  onChange={(e) => setUseExpenseDesc(e.target.value)}
                  placeholder="Ex: Supermercado, Almoço, Farmácia, Combustível..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Valor (R$) <span className="text-rose-500">*</span>
                  </label>
                  <CurrencyInput
                    required
                    value={useExpenseAmount || ''}
                    onChangeValue={(val) => setUseExpenseAmount(parseFloat(val) || 0)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-sm"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={useExpenseCategory}
                    onChange={(e) => setUseExpenseCategory(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Data da Despesa
                  </label>
                  <input
                    type="date"
                    value={useExpenseDate}
                    onChange={(e) => setUseExpenseDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={useExpensePaymentMethod}
                    onChange={(e) => setUseExpensePaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none text-xs font-medium"
                  >
                    <option value="debit_card">Débito</option>
                    <option value="pix">PIX</option>
                    <option value="credit_card">Crédito</option>
                    <option value="cash">Dinheiro</option>
                    <option value="boleto">Boleto</option>
                    <option value="direct_debit">Déb. Automático</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Observação (Opcional)
                </label>
                <input
                  type="text"
                  value={useExpenseObs}
                  onChange={(e) => setUseExpenseObs(e.target.value)}
                  placeholder="Ex: Compra do mês, almoço de trabalho..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Status: <strong>Concluído</strong> — A despesa é debitada do saldo e registrada como paga automaticamente.</span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUsingBalanceWallet(null)}
                  className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!useExpenseDesc.trim() || useExpenseAmount <= 0}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Debitar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inserir Benefício */}
      {addingBenefitWallet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto animate-scale-in border border-slate-200 dark:border-slate-700">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Nova Entrada (Crédito / Recarga)
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight">
                    Inserir Benefício: <span className="text-indigo-600 dark:text-indigo-400">{addingBenefitWallet.name}</span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddingBenefitWallet(null)}
                className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance Banner */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 px-6 py-3 border-b border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Saldo Atual do Cartão / Conta:
              </span>
              <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(addingBenefitWallet.balance)}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleAddBenefitSubmit} className="p-4 md:p-6 space-y-4">
              {benefitError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{benefitError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Descrição do Benefício / Recarga <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={benefitDesc}
                  onChange={(e) => setBenefitDesc(e.target.value)}
                  placeholder="Ex: Recarga Caju Alimentação, Vale Refeição, Benefício Mensal..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Valor Creditado (R$) <span className="text-rose-500">*</span>
                  </label>
                  <CurrencyInput
                    required
                    value={benefitAmount || ''}
                    onChangeValue={(val) => setBenefitAmount(parseFloat(val) || 0)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm text-emerald-600 dark:text-emerald-400"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={benefitCategory}
                    onChange={(e) => setBenefitCategory(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  >
                    {incomeCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Data do Depósito
                </label>
                <input
                  type="date"
                  value={benefitDate}
                  onChange={(e) => setBenefitDate(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Observação (Opcional)
                </label>
                <input
                  type="text"
                  value={benefitObs}
                  onChange={(e) => setBenefitObs(e.target.value)}
                  placeholder="Ex: Recarga quinzenal, bônus de alimentação..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Status: <strong>Concluído</strong> — O crédito é adicionado ao saldo do vale/conta e registrado em transações automaticamente.</span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAddingBenefitWallet(null)}
                  className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!benefitDesc.trim() || benefitAmount <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  Inserir Benefício
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lançar Despesa de Fatura Fechada na Data de Vencimento */}
      {launchingInvoiceCard && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-purple-50/50 dark:bg-purple-950/30">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block">Fatura Fechada</span>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Lançar Despesa: {launchingInvoiceCard.name}</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setLaunchingInvoiceCard(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchInvoiceSubmit} className="p-4 md:p-6 space-y-4">
              {launchInvoiceError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{launchInvoiceError}</span>
                </div>
              )}

              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 rounded-xl text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  Esta ação registra uma <strong>despesa pendente</strong> fixada na <strong>data de vencimento</strong> da fatura, garantindo que o valor seja contabilizado corretamente nas saídas do mês.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Valor da Fatura Fechada (R$) <span className="text-rose-500">*</span>
                </label>
                <CurrencyInput
                  required
                  value={launchInvoiceAmount || ''}
                  onChangeValue={(val) => setLaunchInvoiceAmount(parseFloat(val) || 0)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-extrabold text-lg text-purple-600 dark:text-purple-400"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Data de Vencimento da Fatura <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={launchInvoiceDueDate}
                  onChange={(e) => setLaunchInvoiceDueDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Conta Bancária de Débito (Opcional)
                </label>
                <select
                  value={launchInvoiceWalletId}
                  onChange={(e) => setLaunchInvoiceWalletId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none text-xs font-medium"
                >
                  <option value="">Nenhuma (Conta Indefinida)</option>
                  {otherWallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Saldo: R$ {w.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={launchInvoicePaymentMethod}
                    onChange={(e) => setLaunchInvoicePaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none text-xs font-medium"
                  >
                    <option value="boleto">Boleto Bancário</option>
                    <option value="pix">PIX</option>
                    <option value="direct_debit">Débito Automático</option>
                    <option value="credit_card">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={launchInvoiceCategory}
                    onChange={(e) => setLaunchInvoiceCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none text-xs font-medium"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Observação
                </label>
                <input
                  type="text"
                  value={launchInvoiceObs}
                  onChange={(e) => setLaunchInvoiceObs(e.target.value)}
                  placeholder="Ex: Fatura mês de Julho"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="launchAutoPayCheck"
                  checked={launchInvoiceAutoPay}
                  onChange={(e) => setLaunchInvoiceAutoPay(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="launchAutoPayCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Baixa automática na data de vencimento
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLaunchingInvoiceCard(null)}
                  className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={launchInvoiceAmount <= 0}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  Lançar no Vencimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Parcelamentos do Cartão */}
      {managingInstallmentsCard && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">Parcelamentos do Cartão</span>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">{managingInstallmentsCard.name}</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setManagingInstallmentsCard(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
              {cardInstallmentGroups.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                  <Layers className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm font-bold">Nenhum parcelamento ativo encontrado neste cartão.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Ao registrar compras parceladas no formulário de transações, o detalhamento completo de cada parcela aparecerá aqui.
                  </p>
                </div>
              ) : (
                cardInstallmentGroups.map((group) => (
                  <div key={group.groupId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200/80 dark:border-slate-600 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{group.title}</h4>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                          {group.paidCount} de {group.totalInstallments} parcelas pagas
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor Restante</span>
                        <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                          R$ {group.remainingAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (group.paidCount / group.totalInstallments) * 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {group.txs.map((tx) => (
                        <div key={tx.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">{tx.description}</span>
                            <span className="text-[10px] text-slate-400">{formatDateDMY(tx.date)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-800 dark:text-white block">
                              R$ {tx.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tx.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                              {tx.status === 'paid' ? 'Paga' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-right">
              <button
                type="button"
                onClick={() => setManagingInstallmentsCard(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-indigo-600/20"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
