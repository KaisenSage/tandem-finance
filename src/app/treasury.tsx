"use client";

import {
  ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, Bell, Building2,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, CreditCard, Download,
  FileText, Filter, LayoutDashboard, MoreHorizontal, Plus, Search, Settings2,
  ShieldCheck, Users, WalletCards, X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Currency = "NGN" | "USD" | "GBP" | "EUR";
type PageName = "Overview" | "Payments" | "Approvals" | "Transactions" | "Suppliers" | "Reports";
type ModalName = "payment" | "conversion" | "supplier" | "supplierDetails" | "transaction" | "wallet" | "settings" | "help" | "approvalConfirmation" | null;
type Status = "Paid" | "Processing" | "Awaiting approval" | "Rejected";
type Activity = { id: string; name: string; description: string; amount: number; currency: Currency; status: Status; date: string; direction: "in" | "out"; initials: string; color: string; resultAmount?: number; resultCurrency?: Currency; rate?: number; fee?: number };
type Approval = { id: string; activityId: string; supplier: string; requestedBy: string; amount: number; currency: Currency; due: string; status: "Awaiting approval" | "Processing" | "Rejected" };
type Supplier = { name: string; category: string; country: string; initials: string; color: string };

const currencies: Currency[] = ["NGN", "USD", "GBP", "EUR"];
const symbols: Record<Currency, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };
const initialAvailable: Record<Currency, number> = { NGN: 84650000, USD: 42850, GBP: 18240, EUR: 12680 };
const initialHeld: Record<Currency, number> = { NGN: 5400000, USD: 9150, GBP: 1480, EUR: 0 };
const initialActivity: Activity[] = [
  { id: "TX-8241", name: "Maple & Stone Ltd", description: "Supplier payment · INV-2094", amount: 3250, currency: "USD", status: "Awaiting approval", date: "Today, 10:42 AM", direction: "out", initials: "MS", color: "coral" },
  { id: "TX-8240", name: "FX conversion", description: "NGN → USD · Quote Q-1198", amount: 12500000, currency: "NGN", status: "Paid", date: "Today, 9:18 AM", direction: "out", initials: "↔", color: "mint", resultAmount: 8087.5, resultCurrency: "USD", rate: 0.00065, fee: 62500 },
  { id: "TX-8239", name: "Kora Systems", description: "Software · INV-0881", amount: 8400000, currency: "NGN", status: "Paid", date: "Yesterday, 4:05 PM", direction: "out", initials: "KS", color: "blue" },
  { id: "TX-8238", name: "Jade Apparel Co.", description: "Supplier payment · INV-1440", amount: 1480, currency: "GBP", status: "Awaiting approval", date: "Yesterday, 1:32 PM", direction: "out", initials: "JA", color: "lilac" },
  { id: "TX-8237", name: "Client settlement", description: "Incoming transfer · Ref 90-33", amount: 18500000, currency: "NGN", status: "Paid", date: "14 Oct, 11:16 AM", direction: "in", initials: "↙", color: "yellow" },
  { id: "TX-8236", name: "Southbank Studio", description: "Design services · INV-0927", amount: 5900, currency: "USD", status: "Processing", date: "14 Oct, 9:40 AM", direction: "out", initials: "SS", color: "blue" },
];
const initialApprovals: Approval[] = [
  { id: "PAY-1048", activityId: "TX-8241", supplier: "Maple & Stone Ltd", requestedBy: "Chidi Nwosu", amount: 3250, currency: "USD", due: "Due 18 Oct", status: "Awaiting approval" },
  { id: "PAY-1046", activityId: "TX-8238", supplier: "Jade Apparel Co.", requestedBy: "Amara Okafor", amount: 1480, currency: "GBP", due: "Due 20 Oct", status: "Awaiting approval" },
  { id: "PAY-1042", activityId: "TX-8236", supplier: "Southbank Studio", requestedBy: "Tobi Akinola", amount: 5900, currency: "USD", due: "Due 22 Oct", status: "Processing" },
];
const initialSuppliers: Supplier[] = [
  { name: "Maple & Stone Ltd", category: "Materials & sourcing", country: "United States", initials: "MS", color: "coral" },
  { name: "Jade Apparel Co.", category: "Textile supplier", country: "United Kingdom", initials: "JA", color: "lilac" },
  { name: "Kora Systems", category: "Software & services", country: "Nigeria", initials: "KS", color: "blue" },
  { name: "Southbank Studio", category: "Creative services", country: "United States", initials: "SS", color: "yellow" },
];
const currentUser = "Amara Okafor";
const chartValues: Record<Currency, number[]> = {
  NGN: [42, 58, 46, 68, 52, 72, 60, 84, 65, 77, 58, 92],
  USD: [45, 38, 60, 51, 72, 56, 78, 62, 82, 70, 88, 76],
  GBP: [55, 48, 66, 42, 61, 75, 52, 70, 57, 82, 67, 91],
  EUR: [38, 52, 44, 63, 49, 72, 58, 79, 63, 74, 55, 86],
};
const navItems = [
  { name: "Overview" as const, icon: LayoutDashboard }, { name: "Payments" as const, icon: CreditCard },
  { name: "Approvals" as const, icon: CheckCircle2 }, { name: "Transactions" as const, icon: ArrowLeftRight },
  { name: "Suppliers" as const, icon: Building2 }, { name: "Reports" as const, icon: FileText },
];
function formatAmount(amount: number, currency: Currency, decimals = currency === "NGN" ? 0 : 2) {
  return `${symbols[currency]}${new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount)}`;
}
function initialsFor(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function statusClass(status: Status | Approval["status"]) { return `status-${status.toLowerCase().replaceAll(" ", "-")}`; }
function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Treasury() {
  const [activePage, setActivePage] = useState<PageName>("Overview");
  const [modal, setModal] = useState<ModalName>(null);
  const [available, setAvailable] = useState(initialAvailable);
  const [held, setHeld] = useState(initialHeld);
  const [activity, setActivity] = useState(initialActivity);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [chartCurrency, setChartCurrency] = useState<Currency>("NGN");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "All">("All");
  const [toast, setToast] = useState("");
  const [formError, setFormError] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>("USD");
  const [paymentReference, setPaymentReference] = useState("");
  const [fromCurrency, setFromCurrency] = useState<Currency>("NGN");
  const [toCurrency, setToCurrency] = useState<Currency>("USD");
  const [conversionAmount, setConversionAmount] = useState("1000000");
  const [supplierName, setSupplierName] = useState("");
  const [supplierCountry, setSupplierCountry] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<"approve" | "reject" | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("NGN");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [formattedDate, setFormattedDate] = useState("Local workspace time");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const restoreTimezone = window.setTimeout(() => {
      const savedTimezone = window.localStorage.getItem("tandem-timezone");
      if (savedTimezone && ["Africa/Lagos", "Europe/London", "America/New_York"].includes(savedTimezone)) setTimezone(savedTimezone);
    }, 0);
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActivePage("Transactions");
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.clearTimeout(restoreTimezone);
      window.removeEventListener("keydown", handleShortcut);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const dateTimer = window.setTimeout(() => {
      setFormattedDate(new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: timezone,
      }).format(new Date()));
    }, 0);
    return () => window.clearTimeout(dateTimer);
  }, [timezone]);

  const pendingApprovals = approvals.filter((item) => item.status === "Awaiting approval");
  const filteredActivity = activity.filter((item) => {
    const matchesQuery = `${item.name} ${item.description} ${item.id} ${item.status}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesCurrency = currencyFilter === "All" || item.currency === currencyFilter;
    return matchesQuery && matchesStatus && matchesCurrency;
  });
  const sourceAmount = Number(conversionAmount) || 0;
  const fee = sourceAmount * 0.005;
  const rates: Record<Currency, Record<Currency, number>> = {
    NGN: { NGN: 1, USD: 0.00065, GBP: 0.00048, EUR: 0.0006 },
    USD: { NGN: 1538.46, USD: 1, GBP: 0.74, EUR: 0.92 },
    GBP: { NGN: 2083.33, USD: 1.35, GBP: 1, EUR: 1.24 },
    EUR: { NGN: 1666.67, USD: 1.09, GBP: 0.81, EUR: 1 },
  };
  const fxRate = rates[fromCurrency][toCurrency];
  const convertedAmount = Math.max(0, (sourceAmount - fee) * fxRate);
  function notify(message: string) {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 3200);
  }
  function openModal(name: Exclude<ModalName, null>) { setFormError(""); setModal(name); }
  function closeModal() { setModal(null); setFormError(""); setSelectedApproval(null); setApprovalDecision(null); }
  function openTransaction(item: Activity) { setSelectedActivity(item); openModal("transaction"); }
  function openWallet(currency: Currency) { setSelectedCurrency(currency); openModal("wallet"); }
  function openSupplier(supplier: Supplier) { setSelectedSupplier(supplier); openModal("supplierDetails"); }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(paymentAmount);
    if (!paymentName.trim() || !amount || amount <= 0) { setFormError("Enter a supplier and a payment amount greater than zero."); return; }
    if (amount > available[paymentCurrency]) { setFormError(`Available ${paymentCurrency} balance is too low for this request.`); return; }
    const id = `PAY-${Math.floor(1050 + Math.random() * 800)}`;
    setAvailable((current) => ({ ...current, [paymentCurrency]: current[paymentCurrency] - amount }));
    setHeld((current) => ({ ...current, [paymentCurrency]: current[paymentCurrency] + amount }));
    setApprovals((current) => [{ id, activityId: `TX-${id.slice(-4)}`, supplier: paymentName.trim(), requestedBy: "Amara Okafor", amount, currency: paymentCurrency, due: "Due 22 Oct", status: "Awaiting approval" }, ...current]);
    setActivity((current) => [{ id: `TX-${id.slice(-4)}`, name: paymentName.trim(), description: `Supplier payment${paymentReference ? ` · ${paymentReference}` : " · New request"}`, amount, currency: paymentCurrency, status: "Awaiting approval", date: "Just now", direction: "out", initials: initialsFor(paymentName), color: "blue" }, ...current]);
    setPaymentName(""); setPaymentAmount(""); setPaymentReference(""); closeModal(); setActivePage("Approvals");
    notify("Funds reserved. The request is waiting for approval.");
  }

  function submitConversion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fromCurrency === toCurrency) { setFormError("Choose two different currencies."); return; }
    if (!sourceAmount || sourceAmount <= 0) { setFormError("Enter an amount greater than zero."); return; }
    if (sourceAmount > available[fromCurrency]) { setFormError(`Available ${fromCurrency} balance is too low for this conversion.`); return; }
    setAvailable((current) => ({ ...current, [fromCurrency]: current[fromCurrency] - sourceAmount, [toCurrency]: current[toCurrency] + convertedAmount }));
    setActivity((current) => [{ id: `TX-${Math.floor(8242 + Math.random() * 500)}`, name: "FX conversion", description: `${fromCurrency} → ${toCurrency} · 0.50% fee`, amount: sourceAmount, currency: fromCurrency, status: "Paid", date: "Just now", direction: "out", initials: "↔", color: "mint", resultAmount: convertedAmount, resultCurrency: toCurrency, rate: fxRate, fee }, ...current]);
    closeModal(); notify(`Converted ${formatAmount(sourceAmount, fromCurrency)} to ${formatAmount(convertedAmount, toCurrency)}.`);
  }

  function applyApprovalDecision(item: Approval, decision: "approve" | "reject") {
    if (item.status !== "Awaiting approval") return;
    if (item.requestedBy === currentUser) { notify("A different workspace member must review your request."); return; }
    setApprovals((current) => current.map((approval) => approval.id === item.id ? { ...approval, status: decision === "approve" ? "Processing" : "Rejected" } : approval));
    setActivity((current) => current.map((entry) => entry.id === item.activityId ? { ...entry, status: decision === "approve" ? "Processing" : "Rejected" } : entry));
    if (decision === "reject") {
      setHeld((current) => ({ ...current, [item.currency]: Math.max(0, current[item.currency] - item.amount) }));
      setAvailable((current) => ({ ...current, [item.currency]: current[item.currency] + item.amount }));
      notify(`${item.id} rejected. The reserved funds were released.`);
    } else notify(`${item.id} approved and added to the payout queue.`);
  }

  function requestApprovalDecision(item: Approval, decision: "approve" | "reject") {
    if (item.status !== "Awaiting approval") return;
    if (item.requestedBy === currentUser) { notify("A different workspace member must review your request."); return; }
    setSelectedApproval(item);
    setApprovalDecision(decision);
    openModal("approvalConfirmation");
  }

  function decideApproval(item: Approval, decision: "approve" | "reject") {
    requestApprovalDecision(item, decision);
  }

  function confirmApprovalDecision() {
    if (!selectedApproval || !approvalDecision) return;
    applyApprovalDecision(selectedApproval, approvalDecision);
    closeModal();
  }

  function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplierName.trim() || !supplierCountry.trim()) { setFormError("Add a supplier name and country."); return; }
    setSuppliers((current) => [{ name: supplierName.trim(), category: "New supplier", country: supplierCountry.trim(), initials: initialsFor(supplierName), color: "mint" }, ...current]);
    setSupplierName(""); setSupplierCountry(""); closeModal(); setActivePage("Suppliers"); notify("Supplier added to your workspace.");
  }

  function exportCsv() {
    const rows = [["Reference", "Name", "Description", "Amount", "Currency", "Status", "Date"], ...activity.map((item) => [item.id, item.name, item.description, String(item.amount), item.currency, item.status, item.date])];
    downloadCsv("tandem-transactions.csv", rows);
    notify("Your transaction CSV is ready.");
  }

  function exportWalletCsv() {
    const rows = [["Currency", "Available", "Held"], ...currencies.map((currency) => [currency, String(available[currency]), String(held[currency])])];
    downloadCsv("tandem-wallet-balances.csv", rows);
    notify("Wallet balance CSV downloaded.");
  }

  function exportFxCsv() {
    const conversions = activity.filter((item) => item.name === "FX conversion");
    const rows = [["Reference", "Source amount", "Source currency", "Destination amount", "Destination currency", "Rate", "Fee", "Date"], ...conversions.map((item) => [item.id, String(item.amount), item.currency, String(item.resultAmount ?? ""), item.resultCurrency ?? "", String(item.rate ?? ""), String(item.fee ?? ""), item.date])];
    downloadCsv("tandem-fx-conversions.csv", rows);
    notify("FX conversion CSV downloaded.");
  }

  const search = <label className="search-field"><Search size={16} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" /><kbd>⌘ K</kbd></label>;
  const activeFilterCount = Number(statusFilter !== "All") + Number(currencyFilter !== "All");
  const filterControl = <div className="filter-control"><button className={`icon-button filter-button ${activeFilterCount ? "filter-button-active" : ""}`} aria-label="Filters" aria-expanded={filterOpen} title="Filter transactions" onClick={() => setFilterOpen((open) => !open)}><Filter size={16} />{activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}</button>{filterOpen && <div className="filter-popover" role="group" aria-label="Transaction filters"><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Status | "All")}><option>All</option><option>Awaiting approval</option><option>Processing</option><option>Paid</option><option>Rejected</option></select></label><label>Currency<select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value as Currency | "All")}><option>All</option>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label><button className="clear-filters" onClick={() => { setStatusFilter("All"); setCurrencyFilter("All"); setFilterOpen(false); }}>Clear filters</button></div>}</div>;

  function renderActivityRows(items: Activity[]) {
    return <>{items.map((item) => <tr key={item.id}><td><div className="identity-cell"><span className={`avatar avatar-${item.color}`}>{item.initials}</span><span><strong>{item.name}</strong><small>{item.description}</small></span></div></td><td className="reference-cell">{item.id}</td><td><span className={`status ${statusClass(item.status)}`}><i />{item.status}</span></td><td className="date-cell">{item.date}</td><td className={`amount-cell ${item.direction === "in" ? "amount-in" : ""}`}>{item.direction === "in" ? "+" : "−"}{formatAmount(item.amount, item.currency)}</td><td className="more-cell"><button className="icon-button table-more" title="View transaction details" aria-label={`View transaction details for ${item.id}`} onClick={() => openTransaction(item)}><ArrowRight size={17} /></button></td></tr>)}</>;
  }

  function renderApprovalRows(items: Approval[]) {
    return items.map((item) => {
      const isSelfRequest = item.requestedBy === currentUser;
      return <tr key={item.id}>
        <td><strong className="supplier-name">{item.supplier}</strong><small className="table-secondary">Requested by {item.requestedBy}</small></td>
        <td className="amount-cell">{formatAmount(item.amount, item.currency)}</td>
        <td><span className={`status ${statusClass(item.status)}`}><i />{item.status}</span></td>
        <td className="date-cell">{item.due}</td>
        <td className="approval-actions">{item.status === "Awaiting approval" ? <>
          <button className="icon-button reject-button" disabled={isSelfRequest} title={isSelfRequest ? "A different member must review your request" : "Reject and release funds"} aria-label={`Reject ${item.id}`} onClick={() => decideApproval(item, "reject")}><X size={16} /></button>
          <button className="approve-button" disabled={isSelfRequest} title={isSelfRequest ? "A different member must review your request" : undefined} onClick={() => decideApproval(item, "approve")}><Check size={15} />Approve</button>
        </> : <button className="icon-button" title="View request" aria-label={`View ${item.id}`} onClick={() => notify(`${item.id} · ${item.status}`)}><ArrowRight size={16} /></button>}</td>
      </tr>;
    });
  }

  function renderActivityTable(items: Activity[]) {
    return <div className="table-scroll"><table className="data-table"><thead><tr><th>PAYEE / DESCRIPTION</th><th>REFERENCE</th><th>STATUS</th><th>DATE</th><th className="amount-heading">AMOUNT</th><th /></tr></thead><tbody>{renderActivityRows(items)}</tbody></table>{items.length === 0 && <div className="table-empty">No transactions match “{query}”.</div>}</div>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); setActivePage("Overview"); }}><span className="brand-mark"><span /></span><span>tandem<span className="brand-period">.</span></span></a>
      <div className="workspace-switcher"><span className="workspace-logo">N</span><span className="workspace-copy"><strong>Northstar Studio</strong><small>Business workspace</small></span><ChevronDown size={15} /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="primary-nav" aria-label="Main navigation">{navItems.map(({ name, icon: Icon }) => <button key={name} aria-label={name} className={`nav-link ${activePage === name ? "nav-link-active" : ""}`} onClick={() => setActivePage(name)}><Icon size={18} strokeWidth={1.8} /><span>{name}</span>{name === "Approvals" && <em>{pendingApprovals.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sandbox-note"><span className="sandbox-dot" /><span><strong>Sandbox mode</strong><small>No real funds move</small></span><ShieldCheck size={16} /></div><button className="nav-link settings-link" onClick={() => openModal("settings")}><Settings2 size={18} strokeWidth={1.8} /><span>Settings</span></button><div className="sidebar-divider" /><div className="profile-button"><span className="profile-avatar">AO</span><span className="profile-copy"><strong>Amara Okafor</strong><small>Finance · Admin</small></span><MoreHorizontal size={18} /></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>Northstar Studio</span><span className="breadcrumb-slash">/</span><strong>{activePage}</strong></div><div className="topbar-actions"><span className="date-label">{formattedDate}</span><button className="icon-button help-button" aria-label="Help and sandbox information" title="Help and sandbox information" onClick={() => openModal("help")}><CircleHelp size={18} /></button><button className="icon-button notification-button" aria-label="Notifications and approvals" title="Open approvals" onClick={() => setActivePage("Approvals")}><Bell size={18} />{pendingApprovals.length > 0 && <i />}</button><span className="topbar-divider" /><span className="topbar-avatar">AO</span></div></header>
      <div className="content-wrap">
        <section className="page-heading"><h1 className="visually-hidden">{activePage}</h1><div className="heading-actions">{activePage === "Overview" && <button className="button-secondary" onClick={() => openModal("conversion")}><ArrowLeftRight size={16} />Convert</button>}{activePage === "Transactions" && <button className="button-secondary" onClick={exportCsv}><Download size={16} />Export CSV</button>}<button className="button-primary" onClick={() => openModal("payment")}><Plus size={17} />Request payment</button></div></section>

        {activePage === "Overview" && <>
          <section className="balance-section">
            <div className="section-heading"><div><h2>Wallet balances</h2></div><button className="text-button" onClick={() => setActivePage("Transactions")}>All activity <ArrowRight size={15} /></button></div>
            <div className="balance-grid">{currencies.map((currency) => <article className={`balance-card balance-card-${currency.toLowerCase()}`} key={currency}>
              <div className="balance-card-top"><span className={`currency-flag flag-${currency.toLowerCase()}`}>{symbols[currency]}</span><span className="currency-code">{currency}<span className="currency-name"> · {{ NGN: "Naira", USD: "US Dollar", GBP: "Pound Sterling", EUR: "Euro" }[currency]}</span></span><button className="icon-button balance-more" aria-label={`View ${currency} wallet details`} title={`View ${currency} wallet details`} onClick={() => openWallet(currency)}><ArrowUpRight size={16} /></button></div>
              <div className="balance-amount">{formatAmount(available[currency], currency)}</div><div className="balance-card-foot"><span>Available</span><span className="balance-held">{formatAmount(held[currency], currency)} <small>held</small></span></div>
            </article>)}</div>
            <div className="balance-footnote"><ShieldCheck size={15} /><span>Balances stay separate by currency. Available excludes funds reserved for approval.</span></div>
          </section>

          <div className="dashboard-grid">
            <section className="activity-chart-panel">
              <div className="panel-heading">
                <div><h2>Wallet activity</h2></div>
                <label className="select-wrap">
                  <select value={chartCurrency} onChange={(event) => setChartCurrency(event.target.value as Currency)} aria-label="Chart currency">
                    {currencies.map((currency) => <option key={currency}>{currency}</option>)}
                  </select><ChevronDown size={14} />
                </label>
              </div>
              <div className="chart-summary">
                <strong>{formatAmount(chartCurrency === "NGN" ? 27640000 : chartCurrency === "USD" ? 18240 : chartCurrency === "GBP" ? 7950 : 6420, chartCurrency)}</strong>
                <span className="trend-pill"><ArrowUpRight size={14} />12.8%</span><small>vs. previous 30 days</small>
              </div>
              <div className="chart-area" role="img" aria-label={`${chartCurrency} wallet activity over the last twelve months`}>
                <div className="chart-y-labels"><span>{symbols[chartCurrency]}30m</span><span>{symbols[chartCurrency]}20m</span><span>{symbols[chartCurrency]}10m</span><span>0</span></div>
                <div className="chart-plot">
                  <div className="chart-gridline gridline-one" /><div className="chart-gridline gridline-two" /><div className="chart-gridline gridline-three" />
                  <div className="chart-bars">{chartValues[chartCurrency].map((height, index) => <div key={`${chartCurrency}-${index}`} className={`chart-bar ${index === 11 ? "chart-bar-current" : ""}`} style={{ height: `${height}%` }} />)}</div>
                  <div className="chart-x-labels">{["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month) => <span key={month}>{month}</span>)}</div>
                </div>
              </div>
              <div className="chart-legend"><span className="legend-square" />Money out <span className="legend-square legend-square-light" />Money in</div>
            </section>
            <section className="approvals-panel"><div className="panel-heading"><div><h2>Approval queue <span className="heading-count">{pendingApprovals.length}</span></h2></div><button className="icon-button" aria-label="Open approval queue" title="Open approval queue" onClick={() => setActivePage("Approvals")}><ArrowRight size={17} /></button></div><div className="approval-list">{pendingApprovals.slice(0, 3).map((item) => { const isSelfRequest = item.requestedBy === currentUser; return <article className="approval-item" key={item.id}><span className="approval-icon"><Clock3 size={17} /></span><div className="approval-copy"><strong>{item.supplier}</strong><span>{item.requestedBy} · {item.due.toLowerCase()}</span></div><div className="approval-amount">{formatAmount(item.amount, item.currency)}<small>{item.currency}</small></div><div className="approval-row-actions"><button className="icon-button reject-button" disabled={isSelfRequest} aria-label={`Reject ${item.id}`} title={isSelfRequest ? "A different member must review this request" : "Reject and release funds"} onClick={() => decideApproval(item, "reject")}><X size={15} /></button><button className="icon-button accept-button" disabled={isSelfRequest} aria-label={`Approve ${item.id}`} title={isSelfRequest ? "A different member must review this request" : "Approve and queue payout"} onClick={() => decideApproval(item, "approve")}><Check size={15} /></button></div></article>; })}{pendingApprovals.length === 0 && <div className="empty-state"><CheckCircle2 size={22} /><span>You’re all caught up.</span></div>}</div><button className="approval-footer" onClick={() => setActivePage("Approvals")}>Open approval queue <ArrowRight size={15} /></button><div className="approval-callout"><span className="callout-icon"><ShieldCheck size={15} /></span><span><strong>Second-person review</strong><small>Requesters cannot approve their own payments.</small></span></div></section>
          </div>
          <section className="transactions-section"><div className="section-heading transactions-heading"><div><h2>Recent transactions</h2></div><div className="table-tools">{search}{filterControl}<button className="text-button" onClick={() => setActivePage("Transactions")}>View all <ArrowRight size={15} /></button></div></div>{renderActivityTable(filteredActivity.slice(0, 5))}</section>
        </>}

        {activePage === "Approvals" && <section className="workspace-panel"><div className="section-heading workspace-section-heading"><div><h2>Approval queue <span className="heading-count">{pendingApprovals.length}</span></h2></div><span className="policy-chip"><ShieldCheck size={15} />No self-approval</span></div><div className="table-scroll"><table className="data-table approvals-table"><thead><tr><th>SUPPLIER / REQUESTER</th><th>AMOUNT</th><th>STATUS</th><th>DUE DATE</th><th /></tr></thead><tbody>{renderApprovalRows(approvals)}</tbody></table></div><div className="policy-note"><ShieldCheck size={17} /><span><strong>Two-person control is on.</strong> Requesters cannot approve their own payments. Rejected requests release their reserved balance.</span></div></section>}

        {activePage === "Payments" && <section className="workspace-panel"><div className="section-heading workspace-section-heading"><div><h2>Payment requests</h2></div><div className="table-tools">{search}{filterControl}</div></div>{renderActivityTable(filteredActivity.filter((item) => item.direction === "out"))}</section>}

        {activePage === "Transactions" && <section className="workspace-panel"><div className="section-heading workspace-section-heading"><div><h2>All transactions</h2></div><div className="table-tools">{search}{filterControl}</div></div>{renderActivityTable(filteredActivity)}<div className="policy-note"><ShieldCheck size={17} /><span><strong>Sandbox activity.</strong> Amounts and statuses are demo data and do not represent real funds.</span></div></section>}

        {activePage === "Suppliers" && <section className="workspace-panel"><div className="section-heading workspace-section-heading"><div><h2>{suppliers.length} suppliers</h2></div><button className="button-secondary" onClick={() => openModal("supplier")}><Plus size={16} />Add supplier</button></div><div className="supplier-grid">{suppliers.map((supplier) => <article className="supplier-row" key={`${supplier.name}-${supplier.country}`}><span className={`avatar avatar-${supplier.color}`}>{supplier.initials}</span><span className="supplier-main"><strong>{supplier.name}</strong><small>{supplier.category}</small></span><span className="supplier-country">{supplier.country}</span><button className="icon-button" aria-label={`View ${supplier.name}`} title={`View ${supplier.name}`} onClick={() => openSupplier(supplier)}><ArrowRight size={17} /></button></article>)}</div><div className="policy-note"><Users size={17} /><span><strong>Workspace directory.</strong> Supplier records are visible to approved workspace members.</span></div></section>}

        {activePage === "Reports" && <section className="workspace-panel reports-panel"><div className="section-heading workspace-section-heading"><div><h2>Statements & exports</h2></div><button className="button-primary" onClick={exportCsv}><Download size={16} />Download CSV</button></div><div className="report-list"><article className="report-row"><span className="report-icon report-icon-green"><FileText size={19} /></span><span><strong>Transaction statement</strong><small>Payments, conversions, and incoming transfers</small></span><span className="report-period">{formattedDate}</span><button className="icon-button" aria-label="Download transaction statement" title="Download transaction statement" onClick={exportCsv}><Download size={17} /></button></article><article className="report-row"><span className="report-icon report-icon-blue"><WalletCards size={19} /></span><span><strong>Wallet balances</strong><small>Available and held balances by currency</small></span><span className="report-period">As of {formattedDate}</span><button className="icon-button" onClick={exportWalletCsv} aria-label="Download wallet balances" title="Download wallet balances"><Download size={17} /></button></article><article className="report-row"><span className="report-icon report-icon-yellow"><ArrowLeftRight size={19} /></span><span><strong>FX conversion history</strong><small>Source, destination, rate, and fee snapshots</small></span><span className="report-period">{formattedDate}</span><button className="icon-button" onClick={exportFxCsv} aria-label="Download FX conversion history" title="Download FX conversion history"><Download size={17} /></button></article></div><div className="policy-note"><Clock3 size={17} /><span><strong>Times shown in {timezone}.</strong> Export date filters use workspace-local days.</span></div></section>}

        <footer className="page-footer"><span>© 2026 Tandem Financial Sandbox</span><span><span className="footer-status" />All systems operational</span><button onClick={() => notify("Sandbox environment · data resets when this page is refreshed.")}>Demo environment <ArrowUpRight size={13} /></button></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-header"><span className="dialog-icon">{modal === "payment" ? <CreditCard size={19} /> : modal === "conversion" ? <ArrowLeftRight size={19} /> : modal === "settings" ? <Settings2 size={19} /> : modal === "help" ? <CircleHelp size={19} /> : modal === "approvalConfirmation" ? <ShieldCheck size={19} /> : <Building2 size={19} />}</span><button className="icon-button" aria-label="Close dialog" onClick={closeModal}><X size={18} /></button></div>
      {modal === "approvalConfirmation" && selectedApproval && approvalDecision && <><span className="section-kicker">PAYMENT DECISION</span><h2 id="dialog-title">{approvalDecision === "approve" ? "Approve this payment?" : "Reject this request?"}</h2><p className="dialog-description">{approvalDecision === "approve" ? "This payment will move to the payout queue." : "The request will be rejected and its reserved funds released."}</p><div className="quote-box detail-box"><span>Supplier <strong>{selectedApproval.supplier}</strong></span><span>Amount <strong>{formatAmount(selectedApproval.amount, selectedApproval.currency)}</strong></span><span>Requested by <strong>{selectedApproval.requestedBy}</strong></span><span>Due date <strong>{selectedApproval.due}</strong></span><span>Invoice / reference <strong>{activity.find((entry) => entry.id === selectedApproval.activityId)?.description ?? selectedApproval.id}</strong></span><span>Request <strong>{selectedApproval.id}</strong></span></div><div className="approval-confirm-actions"><button className="button-secondary" onClick={closeModal}>Cancel</button><button className={`button-primary ${approvalDecision === "reject" ? "approval-confirm-reject" : ""}`} onClick={confirmApprovalDecision}>{approvalDecision === "approve" ? "Approve payment" : "Reject request"}</button></div><p className="dialog-footnote"><ShieldCheck size={14} />Sandbox decision. No real funds will move.</p></>}
      {modal === "payment" && <form onSubmit={submitPayment}><span className="section-kicker">OUTGOING PAYMENT</span><h2 id="dialog-title">Request a payment</h2><p className="dialog-description">Funds are reserved now and released if the request is rejected.</p><label className="form-label">Supplier or payee<input value={paymentName} onChange={(event) => setPaymentName(event.target.value)} placeholder="e.g. Maple & Stone Ltd" autoFocus /></label><div className="form-row"><label className="form-label">Amount<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="0.00" /></label><label className="form-label">Currency<select value={paymentCurrency} onChange={(event) => setPaymentCurrency(event.target.value as Currency)}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div><label className="form-label">Invoice reference <span className="optional-label">OPTIONAL</span><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Invoice number or note" /></label><div className="form-balance"><WalletCards size={16} /><span>Available balance</span><strong>{formatAmount(available[paymentCurrency], paymentCurrency)}</strong></div>{formError && <p className="form-error">{formError}</p>}<button className="button-primary dialog-submit" type="submit">Reserve funds <ArrowRight size={16} /></button><p className="dialog-footnote"><ShieldCheck size={14} />Sandbox only. No real money will move.</p></form>}
      {modal === "conversion" && <form onSubmit={submitConversion}><span className="section-kicker">TREASURY CONVERSION</span><h2 id="dialog-title">Convert currencies</h2><p className="dialog-description">Indicative seeded rates with a transparent 0.50% fee.</p><label className="form-label">You convert<input type="number" min="0.01" step="0.01" value={conversionAmount} onChange={(event) => setConversionAmount(event.target.value)} /></label><div className="form-row currency-select-row"><label className="form-label">From<select value={fromCurrency} onChange={(event) => setFromCurrency(event.target.value as Currency)}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label><span className="swap-symbol"><ArrowDownLeft size={16} /></span><label className="form-label">To<select value={toCurrency} onChange={(event) => setToCurrency(event.target.value as Currency)}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div><div className="quote-box"><span>Indicative rate <strong>1 {fromCurrency} = {fxRate.toLocaleString("en-US", { maximumFractionDigits: 5 })} {toCurrency}</strong></span><span>Conversion fee <strong>{formatAmount(fee, fromCurrency, 2)}</strong></span><span className="quote-receive">You receive <strong>{formatAmount(convertedAmount, toCurrency)}</strong></span></div>{formError && <p className="form-error">{formError}</p>}<button className="button-primary dialog-submit" type="submit">Review conversion <ArrowRight size={16} /></button><p className="dialog-footnote"><ShieldCheck size={14} />Simulated conversion. Rate shown for demonstration.</p></form>}
      {modal === "supplier" && <form onSubmit={submitSupplier}><h2 id="dialog-title">Add a supplier</h2><p className="dialog-description">Keep supplier details ready for payment requests.</p><label className="form-label">Supplier name<input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Business or individual" autoFocus /></label><label className="form-label">Country<input value={supplierCountry} onChange={(event) => setSupplierCountry(event.target.value)} placeholder="e.g. Nigeria" /></label>{formError && <p className="form-error">{formError}</p>}<button className="button-primary dialog-submit" type="submit">Add supplier <ArrowRight size={16} /></button><p className="dialog-footnote"><ShieldCheck size={14} />Visible to this workspace only.</p></form>}
      {modal === "transaction" && selectedActivity && <><span className="section-kicker">TRANSACTION RECORD</span><h2 id="dialog-title">{selectedActivity.name}</h2><p className="dialog-description">{selectedActivity.description}</p><div className="quote-box detail-box"><span>Reference <strong>{selectedActivity.id}</strong></span><span>Status <strong>{selectedActivity.status}</strong></span><span>Date <strong>{selectedActivity.date}</strong></span><span>Amount <strong>{selectedActivity.direction === "in" ? "+" : "−"}{formatAmount(selectedActivity.amount, selectedActivity.currency)}</strong></span>{selectedActivity.resultAmount && selectedActivity.resultCurrency && <><span>Converted to <strong>{formatAmount(selectedActivity.resultAmount, selectedActivity.resultCurrency)}</strong></span><span>Rate <strong>1 {selectedActivity.currency} = {selectedActivity.rate} {selectedActivity.resultCurrency}</strong></span><span>Fee <strong>{formatAmount(selectedActivity.fee ?? 0, selectedActivity.currency)}</strong></span></>}</div><p className="dialog-footnote"><ShieldCheck size={14} />Sandbox record. No real funds moved.</p></>}
      {modal === "wallet" && <><span className="section-kicker">CURRENCY WALLET</span><h2 id="dialog-title">{selectedCurrency} wallet</h2><p className="dialog-description">Available and reserved balances are tracked separately.</p><div className="quote-box detail-box"><span>Available <strong>{formatAmount(available[selectedCurrency], selectedCurrency)}</strong></span><span>Held for approval <strong>{formatAmount(held[selectedCurrency], selectedCurrency)}</strong></span><span>Total wallet funds <strong>{formatAmount(available[selectedCurrency] + held[selectedCurrency], selectedCurrency)}</strong></span></div><button className="button-secondary dialog-submit" onClick={exportWalletCsv}><Download size={16} />Download wallet statement</button><p className="dialog-footnote"><ShieldCheck size={14} />Balances are simulated in this sandbox.</p></>}
      {modal === "supplierDetails" && selectedSupplier && <><span className="section-kicker">SUPPLIER RECORD</span><h2 id="dialog-title">{selectedSupplier.name}</h2><p className="dialog-description">Workspace supplier details.</p><div className="quote-box detail-box"><span>Category <strong>{selectedSupplier.category}</strong></span><span>Country <strong>{selectedSupplier.country}</strong></span><span>Workspace <strong>Northstar Studio</strong></span></div><button className="button-primary dialog-submit" onClick={() => { setPaymentName(selectedSupplier.name); setPaymentCurrency("USD"); closeModal(); openModal("payment"); }}>Request payment <ArrowRight size={16} /></button></>}
      {modal === "settings" && <><span className="section-kicker">WORKSPACE PREFERENCES</span><h2 id="dialog-title">Display settings</h2><p className="dialog-description">Choose the timezone used for dates and reporting.</p><label className="form-label">Workspace timezone<select value={timezone} onChange={(event) => { setTimezone(event.target.value); window.localStorage.setItem("tandem-timezone", event.target.value); }}><option value="Africa/Lagos">Africa/Lagos (WAT)</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></label><p className="dialog-footnote"><Clock3 size={14} />Stored in this browser for this demo.</p></>}
      {modal === "help" && <><span className="section-kicker">TANDEM SANDBOX</span><h2 id="dialog-title">A safe place to explore</h2><p className="dialog-description">Payments and FX conversions are simulated. This workspace uses demo balances, and all changes reset when you refresh the page.</p><div className="quote-box detail-box"><span>Ledger <strong>Demo data only</strong></span><span>Timezone <strong>{timezone}</strong></span><span>Approval policy <strong>One other member must approve</strong></span></div><button className="button-primary dialog-submit" onClick={closeModal}>Got it <Check size={16} /></button></>}
    </section></div>}
    {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} />{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
  </div>;
}
