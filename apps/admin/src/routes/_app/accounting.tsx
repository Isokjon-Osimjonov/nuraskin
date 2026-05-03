import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../../app/accounting/api/accounting.api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Plus, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  ExternalLink,
  Loader2,
  Eye
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { 
  format, 
  addMonths, 
  subMonths, 
  parseISO
} from 'date-fns';
import { uz } from 'date-fns/locale';
import { AddExpenseSheet } from '../../app/accounting/components/AddExpenseSheet';
import { ExpenseListDialog } from '../../app/accounting/components/ExpenseListDialog';
import { toast } from 'sonner';
import { cn, formatKrw } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const Route = createFileRoute('/_app/accounting')({
  component: AccountingPage,
});

interface AccountingSummary {
  period: string;
  revenue: {
    kor_krw: string;
    uzb_krw: string;
    total_krw: string;
  };
  cogs: {
    total_krw: string;
  };
  cargo: {
    total_krw: string;
  };
  gross_profit: {
    total_krw: string;
    margin_percent: number;
  };
  expenses: {
    by_category: {
      PACKAGING: string;
      PLATFORM_FEE: string;
      SUPPLIES: string;
      WAGES: string;
      OTHER: string;
    };
    order_linked: {
      FREE_SHIPPING_SUBSIDY: string;
      CARGO_OVERAGE: string;
      OTHER: string;
    };
    total_standalone_krw: string;
    total_order_linked_krw: string;
    grand_total_krw: string;
  };
  net_profit: {
    total_krw: string;
    margin_percent: number;
  };
  inventory: {
    items: {
      product_id: string;
      product_name: string;
      units_on_hand: number;
      cost_per_unit_krw: string;
      total_value_krw: string;
    }[];
    grand_total_krw: string;
  };
  outstanding_debt: {
    total_krw: string;
    customer_count: number;
  };
}

function AccountingPage() {
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = React.useState(false);
  const [defaultCategory, setDefaultCategory] = React.useState<string | undefined>();
  const [selectedExpense, setSelectedExpense] = React.useState<any>(null);
  
  const [isListDialogOpen, setIsListDialogOpen] = React.useState(false);
  const [listCategory, setListCategory] = React.useState('');
  const [listCategoryLabel, setListCategoryLabel] = React.useState('');
  const [isListOrderLinked, setIsListOrderLinked] = React.useState(false);

  const [isInventoryExpanded, setIsInventoryExpanded] = React.useState(false);
  const navigate = useNavigate();

  const monthStr = format(selectedMonth, 'yyyy-MM');

  const { data: summary, isLoading, isError } = useQuery<AccountingSummary>({
    queryKey: ['accounting-summary', monthStr],
    queryFn: () => accountingApi.getSummary(monthStr),
  });

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const handleExport = async () => {
    try {
      await accountingApi.exportExcel(monthStr);
      toast.success('Hisobot yuklab olindi');
    } catch (err) {
      toast.error('Eksportda xatolik yuz berdi');
    }
  };

  const openExpenseSheet = (category?: string, expense?: any) => {
    setSelectedExpense(expense || null);
    setDefaultCategory(category);
    setIsExpenseSheetOpen(true);
  };

  const openListDialog = (category: string, label: string, orderLinked = false) => {
    setListCategory(category);
    setListCategoryLabel(label);
    setIsListOrderLinked(orderLinked);
    setIsListDialogOpen(true);
  };

  const handleEditFromList = (expense: any) => {
    setIsListDialogOpen(false);
    openExpenseSheet(expense.category, expense);
  };

  const formatPercent = (val: number) => {
    return val.toFixed(1) + '%';
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-6 text-center text-destructive">
        Ma'lumotlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  const inventoryItems = isInventoryExpanded 
    ? summary.inventory.items 
    : summary.inventory.items.slice(0, 10);

  return (
    <div className="p-6 space-y-6 bg-muted/10 min-h-screen pb-20">
      {/* SECTION 0 — Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b -mx-6 px-6 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Hisobot</h1>
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 px-3 font-medium capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: uz })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-3 gap-1 text-center">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const d = new Date(selectedMonth.getFullYear(), i, 1);
                    const isSelected = d.getMonth() === selectedMonth.getMonth();
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? 'default' : 'ghost'}
                        size="sm"
                        className="capitalize text-xs h-10"
                        onClick={() => setSelectedMonth(d)}
                      >
                        {format(d, 'MMM', { locale: uz })}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openExpenseSheet()}>
            <Plus className="mr-2 h-4 w-4" /> Xarajat qo'shish
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Excel yuklab olish
          </Button>
        </div>
      </div>

      {/* SECTION 1 — P&L Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Daromad va zarar hisoboti</CardTitle>
          <CardDescription>{format(selectedMonth, 'MMMM yyyy', { locale: uz })} davri uchun</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
            {/* Left Column: Revenue */}
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Tushumlar</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Koreya savdosi</span>
                  <span className="font-mono">{formatKrw(summary.revenue.kor_krw)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>O'zbekiston savdosi</span>
                  <span className="font-mono">{formatKrw(summary.revenue.uzb_krw)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Jami daromad</span>
                  <span className="font-mono">{formatKrw(summary.revenue.total_krw)}</span>
                </div>
                <div className="flex justify-between items-center text-destructive">
                  <span>Sotilgan tovar narxi (FIFO)</span>
                  <span className="font-mono">({formatKrw(summary.cogs.total_krw)})</span>
                </div>
                <div className="flex justify-between items-center text-destructive">
                  <span>Yetkazib berish xarajati</span>
                  <span className="font-mono">({formatKrw(summary.cargo.total_krw)})</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center text-lg font-bold text-green-600">
                  <div className="flex items-center gap-2">
                    <span>Yalpi foyda</span>
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {formatPercent(summary.gross_profit.margin_percent)}
                    </span>
                  </div>
                  <span className="font-mono">{formatKrw(summary.gross_profit.total_krw)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Expenses */}
            <div className="p-6 space-y-4 bg-muted/5">
              <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Operatsion xarajatlar</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Qadoqlash', value: summary.expenses.by_category.PACKAGING, cat: 'PACKAGING' },
                  { label: 'Platforma to\'lovlari', value: summary.expenses.by_category.PLATFORM_FEE, cat: 'PLATFORM_FEE' },
                  { label: 'Materiallar', value: summary.expenses.by_category.SUPPLIES, cat: 'SUPPLIES' },
                  { label: 'Ish haqi', value: summary.expenses.by_category.WAGES, cat: 'WAGES' },
                  { label: 'Boshqa', value: summary.expenses.by_category.OTHER, cat: 'OTHER' },
                ].map((item) => (
                  <div key={item.cat} className="flex justify-between items-center group">
                    <span>{item.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-muted-foreground mr-1">{formatKrw(item.value)}</span>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openExpenseSheet(item.cat)}
                        title="Yangi qo'shish"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      {Number(item.value) > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openListDialog(item.cat, item.label)}
                          title="Batafsil ko'rish va tahrirlash"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <h4 className="font-medium text-xs text-muted-foreground mt-4 uppercase">Buyurtma xarajatlari</h4>
                {[
                  { label: 'Bepul yetkazish subsidiyasi', value: summary.expenses.order_linked.FREE_SHIPPING_SUBSIDY, cat: 'FREE_SHIPPING_SUBSIDY' },
                  { label: 'Yuk oshiqchasi', value: summary.expenses.order_linked.CARGO_OVERAGE, cat: 'CARGO_OVERAGE' },
                  { label: 'Boshqa', value: summary.expenses.order_linked.OTHER, cat: 'OTHER_ORDER_LINKED' },
                ].map((item) => (
                  <div key={item.cat} className="flex justify-between items-center group">
                    <span>{item.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-muted-foreground mr-1">{formatKrw(item.value)}</span>
                      {Number(item.value) > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openListDialog(item.cat, item.label, true)}
                          title="Batafsil ko'rish"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center text-lg font-bold text-destructive">
                  <span>Jami xarajatlar</span>
                  <span className="font-mono">{formatKrw(summary.expenses.grand_total_krw)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="space-y-1">
               <h2 className="text-3xl font-bold tracking-tight">Sof foyda</h2>
               <p className="text-muted-foreground">Soliqlar va overhead xarajatlardan keyingi daromad</p>
             </div>
             <div className="text-right">
               <div className={cn(
                 "text-4xl font-extrabold font-mono",
                 Number(summary.net_profit.total_krw) >= 0 ? "text-green-600" : "text-destructive"
               )}>
                 {formatKrw(summary.net_profit.total_krw)}
               </div>
               <div className="text-lg font-semibold text-muted-foreground mt-1">
                 Marja: {formatPercent(summary.net_profit.margin_percent)}
               </div>
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2 — Inventory Value Card */}
        <Card>
          <CardHeader>
            <CardTitle>Ombor qiymati (hozirgi holat)</CardTitle>
            <CardDescription className="text-xs">Joriy sanaga ko'ra hisoblangan</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.inventory.items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Omborda mahsulot yo'q</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mahsulot</TableHead>
                        <TableHead className="text-right">Miqdor</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Birlik narxi</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Jami qiymat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium max-w-[200px] truncate">{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.units_on_hand}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatKrw(item.cost_per_unit_krw)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatKrw(item.total_value_krw)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="font-bold text-base">Jami</TableCell>
                        <TableCell className="text-right font-mono font-bold text-base whitespace-nowrap">
                          {formatKrw(summary.inventory.grand_total_krw)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                {summary.inventory.items.length > 10 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs h-8"
                    onClick={() => setIsInventoryExpanded(!isInventoryExpanded)}
                  >
                    {isInventoryExpanded ? "Yopish" : "Ko'proq ko'rish"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3 — Outstanding Debt Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Muddati o'tgan qarzlar</CardTitle>
            <CardDescription>To'lovi kutilayotgan buyurtmalar</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.outstanding_debt.total_krw === '0' ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-green-600">
                <CheckCircle className="h-12 w-12" />
                <span className="font-semibold">Hech qanday qarz yo'q</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-extrabold font-mono text-destructive">
                    {formatKrw(summary.outstanding_debt.total_krw)}
                  </div>
                  <p className="text-muted-foreground mt-2 font-medium">
                    {summary.outstanding_debt.customer_count} ta mijoz
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => navigate({ to: '/customers', search: { filter: 'has_debt' } as any })}
                >
                  Mijozlarni ko'rish <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddExpenseSheet 
        open={isExpenseSheetOpen} 
        onOpenChange={setIsExpenseSheetOpen} 
        defaultCategory={defaultCategory}
        expense={selectedExpense}
      />

      <ExpenseListDialog
        open={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
        month={monthStr}
        category={listCategory}
        categoryLabel={listCategoryLabel}
        isOrderLinked={isListOrderLinked}
        onEdit={handleEditFromList}
      />
    </div>
  );
}
