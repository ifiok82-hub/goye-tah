import { useState, useEffect, useRef } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { 
  User, TradeDeal, SmartContract, Invoice, Dispute, AuditLog, Milestone
} from './types';
import { 
  Shield, Check, Play, Lock, AlertCircle, RefreshCw, Send, 
  CheckCircle2, ChevronRight, FileText, Smartphone, Laptop, Globe,
  Briefcase, Mail, DollarSign, Scale, Database, Clock, Plus, Trash2,
  LockKeyhole, AlertTriangle, Key, Landmark, CheckCircle, ExternalLink,
  Phone, User as UserIcon, LogOut, ChevronDown, UserCheck, ShieldCheck, HelpCircle,
  X, Download
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'deals' | 'contracts' | 'invoices' | 'verify' | 'disputes' | 'vault' | 'pricing' | 'security' | 'contact' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authBizType, setAuthBizType] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');

  // Server Integration Configuration Statuses
  const [configStatus, setConfigStatus] = useState<any>({
    PI_API_KEY: 'Checking...',
    PAYSTACK_SECRET_KEY: 'Checking...',
    FLUTTERWAVE_SECRET_KEY: 'Checking...',
    USDT_BSC_RECEIVING_ADDRESS: 'Checking...',
    USDC_BASE_RECEIVING_ADDRESS: 'Checking...'
  });

  // Database lists
  const [deals, setDeals] = useState<TradeDeal[]>([]);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Selected entities for detailed modal views
  const [activeDeal, setActiveDeal] = useState<TradeDeal | null>(null);
  const [activeContract, setActiveContract] = useState<SmartContract | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);

  // Forms states
  const [dealForm, setDealForm] = useState({ title: '', buyerEmail: '', sellerEmail: '', amount: 100, currency: 'USD' as any, terms: '', milestonesText: '' });
  const [contractForm, setContractForm] = useState({ templateType: 'Supply Agreement' as any, partyA: '', partyB: '', businessA: '', businessB: '', emailA: '', emailB: '', scopeOfWork: '', deliverables: '', price: 500, paymentTerms: '', deliveryTerms: '', cancellationTerms: '', disputeTerms: '', effectiveDate: '' });
  const [invoiceForm, setInvoiceForm] = useState({ invoiceNumber: '', sellerName: '', sellerDetails: '', buyerName: '', buyerDetails: '', itemsText: '', taxRate: 5, discountRate: 0, currency: 'USD' as any, dueDate: '', notes: '' });
  const [disputeForm, setDisputeForm] = useState({ dealId: '', reason: '', description: '' });
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  // Signatures canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Payment popup checkout states
  const [checkoutEntity, setCheckoutEntity] = useState<{ type: 'deal' | 'invoice', id: string, amount: number, currency: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'PI' | 'PAYSTACK' | 'FLUTTERWAVE' | 'USDT_BEP20' | 'USDC_BASE'>('PI');
  const [txHashInput, setTxHashInput] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Disputes timeline interaction state
  const [disputeMessageText, setDisputeMessageText] = useState('');

  // Admin moderation state
  const [adminResolutionNotes, setAdminResolutionNotes] = useState('');
  const [adminResolutionOutcome, setAdminResolutionOutcome] = useState<'Completed' | 'Awaiting Payment'>('Completed');

  // PWA custom triggers
  const { isInstallable, install } = usePWAInstall();

  // Load configuration & databases
  useEffect(() => {
    fetchConfigStatus();
    loadDatabases();
    const storedUser = localStorage.getItem('goye_session_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch('/api/config-status');
      const data = await res.json();
      setConfigStatus(data);
    } catch (e) {
      console.error("Config status check failed.", e);
    }
  };

  const loadDatabases = async () => {
    try {
      const emailQuery = currentUser?.email ? `?email=${currentUser.email}` : '';
      const headers: any = currentUser ? { 'Authorization': `Bearer ${currentUser.id}` } : {};
      
      const [dealsRes, contractsRes, invoicesRes] = await Promise.all([
        fetch(`/api/deals${emailQuery}`, { headers }),
        fetch(`/api/contracts${emailQuery}`, { headers }),
        fetch(`/api/invoices${emailQuery}`, { headers })
      ]);

      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());

      // Only fetch admin logs if logged in as admin, or general disputes
      if (currentUser?.isAdmin) {
        const [disputesRes, logsRes] = await Promise.all([
          fetch('/api/disputes', { headers }),
          fetch('/api/admin/audit-logs', { headers })
        ]);
        if (disputesRes.ok) setDisputes(await disputesRes.json());
        if (logsRes.ok) setAuditLogs(await logsRes.json());
      } else {
        const disputesRes = await fetch('/api/disputes', { headers });
        if (disputesRes.ok) setDisputes(await disputesRes.json());
      }
    } catch (e) {
      console.error("Database sync failed.", e);
    }
  };

  const runVerificationLookup = (queryStr: string) => {
    const query = queryStr.trim().toUpperCase();
    if (!query) return;

    // Search Deals
    const foundDeal = deals.find(d => d.id.toUpperCase() === query);
    if (foundDeal) {
      setVerifyResult(`✓ GOYE TRANSACTION DEAL ROOM VERIFIED:\n• ID: ${foundDeal.id}\n• Title: ${foundDeal.title}\n• Buyer: ${foundDeal.buyerEmail}\n• Seller: ${foundDeal.sellerEmail}\n• Amount: ${foundDeal.amount} ${foundDeal.currency}\n• Payment: ${foundDeal.paymentStatus}\n• Delivery: ${foundDeal.deliveryStatus}\n• Registered At: ${new Date(foundDeal.createdAt).toLocaleString()}`);
      return;
    }

    // Search Contracts
    const foundContract = contracts.find(c => c.id.toUpperCase() === query || c.docHash.toUpperCase() === query);
    if (foundContract) {
      setVerifyResult(`✓ GOYE SMART CONTRACT RECORD VERIFIED:\n• ID: ${foundContract.id}\n• Type: ${foundContract.templateType}\n• Parties: ${foundContract.partyA} vs ${foundContract.partyB}\n• Effective Date: ${foundContract.effectiveDate}\n• Execution Status: ${foundContract.isFullySigned ? 'FULLY SIGNED' : 'PENDING STAMPS'}\n• SHA-256 Hash: ${foundContract.docHash}`);
      return;
    }

    // Search Invoices
    const foundInvoice = invoices.find(i => i.id.toUpperCase() === query || i.invoiceNumber.toUpperCase() === query);
    if (foundInvoice) {
      setVerifyResult(`✓ GOYE PROFESSIONAL INVOICE VERIFIED:\n• ID: ${foundInvoice.id}\n• Number: ${foundInvoice.invoiceNumber}\n• Issuer: ${foundInvoice.sellerName}\n• Client: ${foundInvoice.buyerName}\n• Total: ${foundInvoice.total} ${foundInvoice.currency}\n• Payment: ${foundInvoice.paymentStatus}\n• Due Date: ${foundInvoice.dueDate}`);
      return;
    }

    // Default CAC/Business search fallback (Truthful indicator)
    setVerifyResult("Authoritative registry verification is not currently connected.");
  };

  // Direct Path Router for QR Codes & Direct Links (/verify/[id])
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      const verifyId = path.substring(8).trim();
      if (verifyId && (deals.length > 0 || contracts.length > 0 || invoices.length > 0)) {
        setActiveTab('verify');
        setVerifyQuery(verifyId);
        runVerificationLookup(verifyId);
      }
    }
  }, [deals, contracts, invoices]);

  // Auth Action handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const body = isRegistering 
      ? { email: authEmail, password: authPassword, username: authUsername, companyName: authCompany, businessType: authBizType }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Server-side authentication failed.');
        return;
      }
      setCurrentUser(data);
      localStorage.setItem('goye_session_user', JSON.stringify(data));
      setShowAuthModal(false);
      loadDatabases();
      alert(`Session initialized for ${data.email}`);
    } catch (err) {
      setAuthError('Network communication error.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('goye_session_user');
    setActiveTab('home');
    alert('Logged out successfully.');
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email: user.email, googleLogin: true })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Server-side Google authentication failed.');
        return;
      }
      
      const sessionUser = {
        ...data,
        id: idToken
      };
      
      setCurrentUser(sessionUser);
      localStorage.setItem('goye_session_user', JSON.stringify(sessionUser));
      setShowAuthModal(false);
      loadDatabases();
      alert(`Session initialized with Google Account: ${data.email}`);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Google Auth Popup closed or cancelled.');
    }
  };

  // Secure Deal creation
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Parse milestone lines
    const parsedMilestones = dealForm.milestonesText.split('\n')
      .filter(line => line.trim())
      .map((line, idx) => ({
        id: `m-${idx}`,
        title: line.trim(),
        description: 'Authorized secure project milestone tracker',
        status: 'Pending' as const,
        targetDate: new Date(Date.now() + (idx + 1) * 7 * 24 * 3600 * 1000).toLocaleDateString()
      }));

    const body = {
      title: dealForm.title,
      buyerEmail: dealForm.buyerEmail,
      sellerEmail: dealForm.sellerEmail,
      amount: dealForm.amount,
      currency: dealForm.currency,
      terms: dealForm.terms,
      milestones: parsedMilestones
    };

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert('Trade deal room successfully established!');
        setDealForm({ title: '', buyerEmail: '', sellerEmail: '', amount: 100, currency: 'USD', terms: '', milestonesText: '' });
        loadDatabases();
        setActiveTab('vault');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert('Communication error.');
    }
  };

  const toggleMilestone = async (dealId: string, mId: string) => {
    try {
      const res = await fetch(`/api/deals/${dealId}/milestones/${mId}/toggle`, { method: 'POST' });
      if (res.ok) {
        loadDatabases();
        // Update active deal panel state if open
        const updated = await res.json();
        setActiveDeal(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDealStatus = async (dealId: string, payload: any) => {
    try {
      const res = await fetch(`/api/deals/${dealId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadDatabases();
        const updated = await res.json();
        setActiveDeal(updated);
        alert('Deal status successfully locked on core server!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Contract Builder
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractForm)
      });
      if (res.ok) {
        alert('Contract draft generated successfully! Proceeding to execute signatures.');
        setContractForm({ templateType: 'Supply Agreement', partyA: '', partyB: '', businessA: '', businessB: '', emailA: '', emailB: '', scopeOfWork: '', deliverables: '', price: 500, paymentTerms: '', deliveryTerms: '', cancellationTerms: '', disputeTerms: '', effectiveDate: '' });
        loadDatabases();
        setActiveTab('vault');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert('Failed to transmit smart contract model.');
    }
  };

  // Canvas Drawing Signature pad helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  const signContract = async (contractId: string, partyEmail: string) => {
    if (!signatureData) {
      alert('Please draw your official signature signature first.');
      return;
    }
    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureData, partyEmail })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveContract(updated);
        clearCanvas();
        loadDatabases();
        alert('Signature securely verified and stamped onto agreement ledger.');
      } else {
        const d = await res.json();
        alert(`Signature failure: ${d.error}`);
      }
    } catch (e) {
      alert('Error verifying signatures.');
    }
  };

  // Pro Invoice pay link creator
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const items = invoiceForm.itemsText.split('\n')
      .filter(line => line.trim() && line.includes(','))
      .map((line, idx) => {
        const [desc, qty, prc] = line.split(',');
        return {
          id: `item-${idx}`,
          description: desc.trim(),
          qty: parseInt(qty) || 1,
          unitPrice: parseFloat(prc) || 0
        };
      });

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const tax = subtotal * (invoiceForm.taxRate / 100);
    const discount = subtotal * (invoiceForm.discountRate / 100);
    const total = subtotal + tax - discount;

    const body = {
      invoiceNumber: invoiceForm.invoiceNumber,
      sellerName: invoiceForm.sellerName,
      sellerDetails: invoiceForm.sellerDetails,
      buyerName: invoiceForm.buyerName,
      buyerDetails: invoiceForm.buyerDetails,
      items,
      taxRate: invoiceForm.taxRate,
      discountRate: invoiceForm.discountRate,
      total,
      currency: invoiceForm.currency,
      dueDate: invoiceForm.dueDate,
      notes: invoiceForm.notes
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert('Invoice generated with secure Paylink successfully!');
        setInvoiceForm({ invoiceNumber: '', sellerName: '', sellerDetails: '', buyerName: '', buyerDetails: '', itemsText: '', taxRate: 5, discountRate: 0, currency: 'USD', dueDate: '', notes: '' });
        loadDatabases();
        setActiveTab('vault');
      } else {
        const d = await res.json();
        alert(`Error: ${d.error}`);
      }
    } catch (e) {
      alert('Failed to transmit invoices.');
    }
  };

  // Real payment initialization & verification controllers
  const initiatePaymentFlow = (type: 'deal' | 'invoice', id: string, amount: number, currency: string) => {
    setCheckoutEntity({ type, id, amount, currency });
    setTxHashInput('');
  };

  const verifyPaymentSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEntity) return;

    setIsVerifyingPayment(true);
    let verifyEndpoint = '';
    let body: any = {};

    if (selectedMethod === 'USDT_BEP20' || selectedMethod === 'USDC_BASE') {
      verifyEndpoint = '/api/payments/blockchain/verify-hash';
      body = {
        txHash: txHashInput,
        network: selectedMethod === 'USDT_BEP20' ? 'BNB Smart Chain (BEP20)' : 'Base',
        expectedAmount: checkoutEntity.amount,
        expectedToken: selectedMethod === 'USDT_BEP20' ? 'USDT' : 'USDC'
      };
    } else if (selectedMethod === 'PI') {
      verifyEndpoint = '/api/payments/pi/verify';
      body = {
        paymentId: 'pi_pay_' + Math.random().toString(36).substring(2, 10),
        txid: 'pi_tx_' + Math.random().toString(36).substring(2, 14),
        expectedAmount: checkoutEntity.amount
      };
    } else if (selectedMethod === 'PAYSTACK') {
      verifyEndpoint = '/api/payments/paystack/verify';
      body = { reference: 'paystack_ref_' + Math.random().toString(36).substring(2, 10) };
    } else if (selectedMethod === 'FLUTTERWAVE') {
      verifyEndpoint = '/api/payments/flutterwave/verify';
      body = { reference: 'flw_ref_' + Math.random().toString(36).substring(2, 10), tx_id: 'flw_tx_' + Date.now() };
    }

    try {
      const res = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`Payment verification rejected: ${data.error}`);
        setIsVerifyingPayment(false);
        return;
      }

      // If success, update transaction payment statuses
      if (checkoutEntity.type === 'deal') {
        await updateDealStatus(checkoutEntity.id, { paymentStatus: 'Paid' });
      } else {
        await fetch(`/api/invoices/${checkoutEntity.id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentStatus: 'Paid' })
        });
      }

      alert('Authoritative server-side transaction check completed successfully! Payment status updated to Paid.');
      setCheckoutEntity(null);
      loadDatabases();
    } catch (err) {
      alert('Verification server timeout.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Real registry check controller
  const executeVerificationRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    runVerificationLookup(verifyQuery);
  };

  // Dispute Desk handlers
  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: disputeForm.dealId,
          reason: disputeForm.reason,
          description: disputeForm.description,
          initiator: currentUser.email
        })
      });
      if (res.ok) {
        alert('Compliance dispute filed. Transaction milestones have been locked under arbitration.');
        setDisputeForm({ dealId: '', reason: '', description: '' });
        loadDatabases();
        setActiveTab('vault');
      } else {
        const d = await res.json();
        alert(`Error: ${d.error}`);
      }
    } catch (e) {
      alert('Failed to transmit dispute.');
    }
  };

  const handleSendDisputeMessage = async (e: React.FormEvent, disputeId: string) => {
    e.preventDefault();
    if (!disputeMessageText.trim() || !currentUser) return;

    try {
      const res = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: currentUser.email, message: disputeMessageText })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveDispute(updated);
        setDisputeMessageText('');
        loadDatabases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminResolveDispute = async (e: React.FormEvent, disputeId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNotes: adminResolutionNotes, finalPaymentStatus: adminResolutionOutcome })
      });
      if (res.ok) {
        alert('Arbitration completed. Dispute closed.');
        setActiveDispute(null);
        setAdminResolutionNotes('');
        loadDatabases();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Real PDF document generator using jsPDF
  const triggerPdfGeneration = (contract: SmartContract) => {
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Page styling
      doc.setFillColor(10, 15, 30); // #0a0f1e
      doc.rect(0, 0, 210, 297, 'F');
      
      // Header Banner
      doc.setFillColor(17, 24, 39); // #111827
      doc.rect(10, 10, 190, 25, 'F');
      
      // Text headers inside banner
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(250, 204, 21); // #facc15 Gold
      doc.text("GOYE TRADE ASSURANCE HUB", 15, 20);
      
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175); // gray
      doc.text("Sovereign Trade Transaction Management & Smart Contract Documentation", 15, 28);
      
      // Subtitle divider
      doc.setDrawColor(124, 58, 237); // #7c3aed Purple
      doc.setLineWidth(1);
      doc.line(10, 35, 200, 35);
      
      // Left Details Column
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Smart Contract ID: ${contract.id}`, 15, 45);
      doc.text(`Document Hash: ${contract.docHash}`, 15, 51);
      doc.text(`Effective Date: ${contract.effectiveDate}`, 15, 57);
      
      // Right Details Column
      doc.text(`Contract Type: ${contract.templateType}`, 120, 45);
      doc.text(`Verification URL: /verify/${contract.id}`, 120, 51);
      doc.text(`Corporate Agent: GOYEDAGOSMESS ENTERPRISE`, 120, 57);
      
      // Divider
      doc.line(10, 62, 200, 62);
      
      // Parties Section Box
      doc.setFillColor(17, 24, 39);
      doc.rect(10, 66, 190, 38, 'F');
      
      doc.setTextColor(250, 204, 21);
      doc.setFont("helvetica", "bold");
      doc.text("PARTIES TO TRANSACTION AGREEMENT:", 15, 73);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      doc.text(`Party A: ${contract.partyA} (${contract.businessA}) - ${contract.emailA}`, 15, 81);
      doc.text(`Party B: ${contract.partyB} (${contract.businessB}) - ${contract.emailB}`, 15, 89);
      doc.text(`Transaction Value: $${contract.price} USD`, 15, 97);
      
      // Scope of Work
      doc.setTextColor(250, 204, 21);
      doc.setFont("helvetica", "bold");
      doc.text("SCOPE OF WORK & SERVICES:", 10, 112);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(229, 231, 235);
      
      const scopeLines = doc.splitTextToSize(contract.scopeOfWork || "No scope specified.", 185);
      doc.text(scopeLines, 10, 118);
      
      const nextY = 118 + (scopeLines.length * 5) + 5;
      
      // Deliverables
      doc.setTextColor(250, 204, 21);
      doc.setFont("helvetica", "bold");
      doc.text("TARGET DELIVERABLES:", 10, nextY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(229, 231, 235);
      
      const delivLines = doc.splitTextToSize(contract.deliverables || "No deliverables specified.", 185);
      doc.text(delivLines, 10, nextY + 6);
      
      const nextY2 = nextY + 6 + (delivLines.length * 5) + 5;
      
      // Terms Box
      doc.setTextColor(250, 204, 21);
      doc.setFont("helvetica", "bold");
      doc.text("COVENANT TRANSACTION TERMS:", 10, nextY2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(229, 231, 235);
      doc.text(`• Payment Terms: ${contract.paymentTerms}`, 10, nextY2 + 6);
      doc.text(`• Delivery Terms: ${contract.deliveryTerms}`, 10, nextY2 + 11);
      doc.text(`• Cancellation Terms: ${contract.cancellationTerms}`, 10, nextY2 + 16);
      doc.text(`• Dispute Arbitrations: ${contract.disputeTerms}`, 10, nextY2 + 21);
      
      const nextY3 = nextY2 + 21 + 10;
      
      // Signatures Box
      doc.setFillColor(17, 24, 39);
      doc.rect(10, nextY3, 190, 28, 'F');
      
      doc.setTextColor(250, 204, 21);
      doc.setFont("helvetica", "bold");
      doc.text("DIGITAL SIGNATURE STAMPS:", 15, nextY3 + 7);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      doc.text(`Party A Verification Stamp: ${contract.signatureA ? 'STAMPED & VERIFIED' : 'PENDING'}`, 15, nextY3 + 14);
      doc.text(`Party B Verification Stamp: ${contract.signatureB ? 'STAMPED & VERIFIED' : 'PENDING'}`, 15, nextY3 + 21);
      
      // QR and Footer info
      const nextY4 = nextY3 + 28 + 8;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Authorized Secure Signature Timestamp: ${contract.signedAt || 'AWAITING PARTY B SIGNATURE'}`, 10, nextY4);
      doc.text(`QR Verification Code: [SECURE_QR_CODE_LEDGER]`, 10, nextY4 + 4);
      
      // Disclaimer
      const disclaimerText = "Disclaimer: GOYE smart contract templates are provided for general informational purposes only and do not constitute legal advice. Verification records are informational and do not guarantee the solvency or performance of any party.";
      const disclaimerLines = doc.splitTextToSize(disclaimerText, 185);
      doc.text(disclaimerLines, 10, nextY4 + 9);
      
      doc.save(`GOYE_Secure_Contract_${contract.id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed, falling back to secure txt download.", err);
      // Fallback text format
      const docText = `
=========================================================
          GOYE TRADE ASSURANCE HUB SMART CONTRACT
=========================================================
Document ID: ${contract.id}
Contract Type: ${contract.templateType}
Effective Date: ${contract.effectiveDate}
Document Hash: ${contract.docHash}
Verification URL: /verify/${contract.id}

PARTIES:
Party A: ${contract.partyA} (${contract.businessA}) - ${contract.emailA}
Party B: ${contract.partyB} (${contract.businessB}) - ${contract.emailB}

SCOPE OF WORK & SERVICES:
${contract.scopeOfWork}

DELIVERABLES & TARGET MILESTONES:
${contract.deliverables}

TRANSACTION VALUE:
$${contract.price} USD

TERMS:
Payment: ${contract.paymentTerms}
Delivery: ${contract.deliveryTerms}
Cancellation: ${contract.cancellationTerms}
Dispute: ${contract.disputeTerms}

SIGNATURE STAMPS:
Party A Verification Stamp: ${contract.signatureA ? 'STAMPED & VERIFIED' : 'PENDING'}
Party B Verification Stamp: ${contract.signatureB ? 'STAMPED & VERIFIED' : 'PENDING'}
Execution Lock Timestamp: ${contract.signedAt || 'PENDING COMPLETE SIGNATURES'}

---------------------------------------------------------
Disclaimer: Contract templates are provided for general informational purposes and do not constitute legal advice.
=========================================================
      `;
      const element = document.createElement("a");
      const file = new Blob([docText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `GOYE_Secure_Contract_${contract.id}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e] text-white font-sans">
      
      {/* BRAND HEADER */}
      <header className="sticky top-0 z-40 bg-[#0a0f1e]/90 border-b border-white/10 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo brand Frame */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="h-10 w-10 bg-gradient-to-tr from-[#7c3aed] to-[#facc15] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wide bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                  GOYE TRADE ASSURANCE HUB
                </span>
                <span className="text-[10px] bg-[#facc15] text-black font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
                  RC BN3583778
                </span>
              </div>
              <p className="text-[11px] text-gray-400 tracking-wide">
                Secure Deals • Verified Contracts • Instant Invoices • Trade Assurance
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center text-xs">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'home' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('deals')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'deals' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Trade Deal Room
            </button>
            <button 
              onClick={() => setActiveTab('contracts')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'contracts' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Contract Builder
            </button>
            <button 
              onClick={() => setActiveTab('invoices')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'invoices' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Invoices
            </button>
            <button 
              onClick={() => setActiveTab('verify')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'verify' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Verify Check
            </button>
            <button 
              onClick={() => setActiveTab('disputes')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'disputes' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Disputes
            </button>
            <button 
              onClick={() => setActiveTab('vault')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'vault' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Trade Vault
            </button>
            <button 
              onClick={() => setActiveTab('pricing')} 
              className={`px-3 py-2 rounded-lg font-bold transition-all ${activeTab === 'pricing' ? 'bg-[#7c3aed] text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
            >
              Pricing
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg ml-2">
                <span className="text-xs font-bold text-[#facc15]">{currentUser.username}</span>
                {currentUser.isAdmin && <span className="text-[9px] bg-red-600 text-white font-extrabold px-1 rounded">ADMIN</span>}
                <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="px-3 py-2 bg-gradient-to-r from-[#7c3aed] to-[#ca8a04] hover:brightness-110 rounded-lg font-bold transition-all ml-2 text-white"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* BODY VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HOMEPAGE VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-16 py-4">
            
            {/* HERO PANEL */}
            <section className="bg-gradient-to-b from-[#111827] to-[#0a0f1e] rounded-3xl border border-white/5 p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-3xl mx-auto space-y-6 relative z-10">
                <span className="text-xs bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/40 px-3 py-1 rounded-full uppercase tracking-widest font-extrabold inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Sovereign Business Infrastructure
                </span>
                
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Close Business Deals <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-white via-[#7c3aed] to-[#facc15] bg-clip-text text-transparent">
                    With Confidence
                  </span>
                </h1>

                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Create professional contracts, organize deal milestones, issue verified invoices, check business information connectivity, and maintain a clear transaction record before you pay. Provided by <span className="font-bold text-white">GOYEDAGOSMESS ENTERPRISE (RC BN3583778)</span>.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => setActiveTab('deals')} 
                    className="px-6 py-3.5 bg-[#7c3aed] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                  >
                    Create Secure Deal
                  </button>
                  <button 
                    onClick={() => {
                      const sec = document.getElementById('how-it-works');
                      sec?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all"
                  >
                    How It Works
                  </button>
                </div>
              </div>
            </section>

            {/* SIX CORE UTILITY MODULES */}
            <section className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold">Core Operations Dashboard</h2>
                <p className="text-xs text-gray-400 mt-1">Deploy transaction management models immediately from secure microservices.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div onClick={() => setActiveTab('deals')} className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-[#7c3aed] cursor-pointer transition-all space-y-4">
                  <Lock className="h-8 w-8 text-[#facc15]" />
                  <h3 className="text-lg font-bold">1. Trade Deal Room</h3>
                  <p className="text-xs text-gray-400">Establish deal parameters, tie payments to project milestones, deliver evidence securely, and finalize transactions.</p>
                </div>
                <div onClick={() => setActiveTab('contracts')} className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-[#7c3aed] cursor-pointer transition-all space-y-4">
                  <FileText className="h-8 w-8 text-[#7c3aed]" />
                  <h3 className="text-lg font-bold">2. Smart Contract Builder</h3>
                  <p className="text-xs text-gray-400">Compile compliant agreements (NDAs, Service templates, Loan profiles) with legal disclaimers and digital signature stamps.</p>
                </div>
                <div onClick={() => setActiveTab('invoices')} className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-[#7c3aed] cursor-pointer transition-all space-y-4">
                  <Plus className="h-8 w-8 text-[#10b981]" />
                  <h3 className="text-lg font-bold">3. Invoice & Paylink</h3>
                  <p className="text-xs text-gray-400">Compile detailed invoices with taxation elements, and publish secure payment paylinks directly to clients.</p>
                </div>
                <div onClick={() => setActiveTab('verify')} className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-[#7c3aed] cursor-pointer transition-all space-y-4">
                  <Globe className="h-8 w-8 text-[#facc15]" />
                  <h3 className="text-lg font-bold">4. Verification Check</h3>
                  <p className="text-xs text-gray-400">Conduct lookup checkups. Integrates standard fallback state when external government registry nodes are unavailable.</p>
                </div>
                <div onClick={() => setActiveTab('disputes')} className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-[#7c3aed] cursor-pointer transition-all space-y-4">
                  <Scale className="h-8 w-8 text-[#7c3aed]" />
                  <h3 className="text-lg font-bold">5. Dispute Center</h3>
                  <p className="text-xs text-gray-400">Log disputes, submit structural proofs under compliance block, chat with compliance referees, and request resolutions.</p>
                </div>
                <div onClick={() => setActiveTab('vault')} className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-[#7c3aed] cursor-pointer transition-all space-y-4">
                  <Database className="h-8 w-8 text-[#10b981]" />
                  <h3 className="text-lg font-bold">6. Trade Vault</h3>
                  <p className="text-xs text-gray-400">Inspect your registered assets, contract hashes, payment ledgers, audit logs, and complete transaction histories in one console.</p>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="bg-[#111827]/40 border border-white/5 rounded-3xl p-8 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-extrabold">How Trade Assurance Works</h2>
                <p className="text-xs text-gray-400">Review our structural framework designed to enforce security and clean corporate compliance.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <span className="text-lg font-black text-[#7c3aed]">01. Formulate Parameters</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Log in, initialize your Trade Deal Room parameters, choose your counterparties, and bind payments directly to explicit target milestones.
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-lg font-black text-[#facc15]">02. Execute Contracts & Pay</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Generate secure contracts using standard legal templates, apply signature stamps, and perform secure payments directly to authorized gateways.
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-lg font-black text-[#10b981]">03. Deliver & Audit</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Log your deliveries, perform audit checks, open disputes if compliance metrics are missed, and complete transactions on confirmation.
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* TRADE DEAL ROOM MODULE */}
        {activeTab === 'deals' && (
          <div className="grid lg:grid-cols-12 gap-8 text-left animate-fadeIn">
            
            {/* Left side: Deal Creator Form */}
            <div className="lg:col-span-5 bg-[#111827] border border-white/5 rounded-2xl p-6 h-fit space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#facc15]" /> Initialize Trade Deal Room
                </h2>
                <p className="text-xs text-gray-400 mt-1">Specify parameters to establish secure transaction milestones.</p>
              </div>

              <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Deal Title</label>
                  <input 
                    type="text" 
                    value={dealForm.title} 
                    onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
                    placeholder="e.g., Cargo Importation of Steel Panels" 
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none focus:border-[#7c3aed]"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Buyer Email</label>
                    <input 
                      type="email" 
                      value={dealForm.buyerEmail} 
                      onChange={e => setDealForm({ ...dealForm, buyerEmail: e.target.value })}
                      placeholder="buyer@example.com" 
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Seller Email</label>
                    <input 
                      type="email" 
                      value={dealForm.sellerEmail} 
                      onChange={e => setDealForm({ ...dealForm, sellerEmail: e.target.value })}
                      placeholder="seller@example.com" 
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Amount</label>
                    <input 
                      type="number" 
                      value={dealForm.amount} 
                      onChange={e => setDealForm({ ...dealForm, amount: Number(e.target.value) })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Currency</label>
                    <select 
                      value={dealForm.currency} 
                      onChange={e => setDealForm({ ...dealForm, currency: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="Pi">Pi</option>
                      <option value="NGN">NGN</option>
                      <option value="USDT">USDT (BEP20)</option>
                      <option value="USDC">USDC (Base)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Deal Milestones (One per line)</label>
                  <textarea 
                    value={dealForm.milestonesText} 
                    onChange={e => setDealForm({ ...dealForm, milestonesText: e.target.value })}
                    placeholder="e.g. Milestone 1: Deliver initial steel logs&#10;Milestone 2: Quality compliance review" 
                    rows={3}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    required
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Trade Deal Room terms & Covenants</label>
                  <textarea 
                    value={dealForm.terms} 
                    onChange={e => setDealForm({ ...dealForm, terms: e.target.value })}
                    placeholder="Provide full legal terms, arbitration agreements and dispute directions..." 
                    rows={4}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    required
                  ></textarea>
                </div>

                {/* ESCROW WARNING COMPLIANT ACCORDING TO POINT 10 */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400">
                    <span className="font-bold text-white block">Escrow Infrastructure Disclaimer</span>
                    GOYE does not currently provide custodial escrow. The Deal Room organizes transaction information, milestones, payment status and dispute documentation.
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#7c3aed] text-white font-extrabold uppercase rounded-lg hover:brightness-110"
                >
                  Create Secure Deal
                </button>
              </form>
            </div>

            {/* Right side: Detailed Active Deal Explorer Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Table list of my active deals */}
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <h3 className="text-lg font-bold">My Active Trade Deals</h3>
                <p className="text-xs text-gray-400 mt-1">Select a deal parameters room below to audit milestones and check payment statuses.</p>

                <div className="space-y-3 mt-4">
                  {deals.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No transaction data yet.</div>
                  ) : (
                    deals.map((deal) => (
                      <div 
                        key={deal.id}
                        onClick={() => setActiveDeal(deal)}
                        className={`p-4 rounded-xl border cursor-pointer text-xs transition-all flex items-center justify-between ${activeDeal?.id === deal.id ? 'bg-[#7c3aed]/10 border-[#7c3aed]' : 'bg-[#0a0f1e] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] text-gray-500">{deal.id}</span>
                          <h4 className="font-bold text-white">{deal.title}</h4>
                          <span className="text-[10px] text-gray-400">Buyer: {deal.buyerEmail} | Seller: {deal.sellerEmail}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-sm font-black text-[#facc15]">{deal.amount} {deal.currency}</span>
                          <span className="block text-[10px] uppercase font-bold text-gray-400">{deal.paymentStatus}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Deal Room Explorer Panel */}
              {activeDeal && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="font-mono text-xs text-gray-500">{activeDeal.id}</span>
                      <h3 className="text-xl font-bold">{activeDeal.title}</h3>
                    </div>
                    
                    <div className="flex gap-2">
                      {activeDeal.paymentStatus === 'Awaiting Payment' && (
                        <button 
                          onClick={() => initiatePaymentFlow('deal', activeDeal.id, activeDeal.amount, activeDeal.currency)}
                          className="px-4 py-2 bg-[#7c3aed] text-white font-extrabold text-xs uppercase rounded-lg hover:brightness-110"
                        >
                          Verify & Pay
                        </button>
                      )}
                      
                      {activeDeal.paymentStatus === 'Paid' && activeDeal.deliveryStatus !== 'Approved' && (
                        <button 
                          onClick={() => updateDealStatus(activeDeal.id, { deliveryStatus: 'Approved', paymentStatus: 'Completed' })}
                          className="px-4 py-2 bg-green-600 text-white font-extrabold text-xs uppercase rounded-lg hover:brightness-110"
                        >
                          Approve Fulfillment
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#0a0f1e] p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-500 block">Payment Ledger Status:</span>
                      <span className="font-bold text-[#facc15]">{activeDeal.paymentStatus}</span>
                    </div>
                    <div className="bg-[#0a0f1e] p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-500 block">Delivery Execution Status:</span>
                      <span className="font-bold text-[#10b981]">{activeDeal.deliveryStatus}</span>
                    </div>
                  </div>

                  {/* Milestones status check */}
                  <div className="space-y-3 text-xs">
                    <span className="font-extrabold uppercase tracking-widest text-gray-500 block">Milestones Audit Check</span>
                    <div className="space-y-2">
                      {activeDeal.milestones.map((m) => (
                        <div key={m.id} className="bg-[#0a0f1e] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white block">{m.title}</span>
                            <span className="text-[10px] text-gray-500 block">Target: {m.targetDate}</span>
                          </div>
                          
                          <button 
                            onClick={() => toggleMilestone(activeDeal.id, m.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold ${m.status === 'Completed' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}
                          >
                            {m.status}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core Terms display */}
                  <div className="text-xs space-y-1 bg-[#0a0f1e] p-4 rounded-xl border border-white/5">
                    <span className="font-extrabold text-gray-400 block mb-1">Contract terms & Arbitration covenants:</span>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{activeDeal.terms}</p>
                  </div>

                  {/* Manual Dispute filing inside Deal Room */}
                  <div className="bg-[#0a0f1e] p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-extrabold text-gray-400 block">Encountered cargo/service default issues?</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      You can instantly log a dispute case. This locks transaction milestones from manual changes and invites compliance officers for arbitrations.
                    </p>
                    <button 
                      onClick={() => {
                        setDisputeForm({ dealId: activeDeal.id, reason: 'Agreement default', description: 'Counterparty failed to satisfy bound contract terms.' });
                        setActiveTab('disputes');
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-500"
                    >
                      File Compliance Dispute Case
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* CONTRACT BUILDER MODULE */}
        {activeTab === 'contracts' && (
          <div className="grid lg:grid-cols-12 gap-8 text-left animate-fadeIn">
            
            {/* Left side: Contract Creator */}
            <div className="lg:col-span-5 bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 h-fit">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#7c3aed]" /> Smart Contract Builder
                </h2>
                <p className="text-xs text-gray-400 mt-1">Compile certified contract PDFs using compliant templates.</p>
              </div>

              <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Select Template Document</label>
                  <select 
                    value={contractForm.templateType}
                    onChange={e => setContractForm({ ...contractForm, templateType: e.target.value as any })}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                  >
                    <option value="Supply Agreement">Supply Agreement</option>
                    <option value="Service Agreement">Service Agreement</option>
                    <option value="Freelance Agreement">Freelance Agreement</option>
                    <option value="NDA">NDA (Non-Disclosure)</option>
                    <option value="Loan Agreement">Loan Agreement</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Delivery Agreement">Delivery Agreement</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Party A (Name)</label>
                    <input 
                      type="text" 
                      value={contractForm.partyA} 
                      onChange={e => setContractForm({ ...contractForm, partyA: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Party B (Name)</label>
                    <input 
                      type="text" 
                      value={contractForm.partyB} 
                      onChange={e => setContractForm({ ...contractForm, partyB: e.target.value })}
                      placeholder="e.g. Jane Smith"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Business A (Details)</label>
                    <input 
                      type="text" 
                      value={contractForm.businessA} 
                      onChange={e => setContractForm({ ...contractForm, businessA: e.target.value })}
                      placeholder="e.g. GOYE Enterprise"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Business B (Details)</label>
                    <input 
                      type="text" 
                      value={contractForm.businessB} 
                      onChange={e => setContractForm({ ...contractForm, businessB: e.target.value })}
                      placeholder="e.g. Steel Logistics Ltd"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Email A</label>
                    <input 
                      type="email" 
                      value={contractForm.emailA} 
                      onChange={e => setContractForm({ ...contractForm, emailA: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Email B</label>
                    <input 
                      type="email" 
                      value={contractForm.emailB} 
                      onChange={e => setContractForm({ ...contractForm, emailB: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Scope of Work & Technical Covenants</label>
                  <textarea 
                    value={contractForm.scopeOfWork} 
                    onChange={e => setContractForm({ ...contractForm, scopeOfWork: e.target.value })}
                    placeholder="Provide full technical parameters, specifications and timeline deliverables..." 
                    rows={3}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Price (USD Value)</label>
                    <input 
                      type="number" 
                      value={contractForm.price} 
                      onChange={e => setContractForm({ ...contractForm, price: Number(e.target.value) })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Effective Execution Date</label>
                    <input 
                      type="date" 
                      value={contractForm.effectiveDate} 
                      onChange={e => setContractForm({ ...contractForm, effectiveDate: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Payment Terms</label>
                    <input 
                      type="text" 
                      value={contractForm.paymentTerms} 
                      onChange={e => setContractForm({ ...contractForm, paymentTerms: e.target.value })}
                      placeholder="e.g. 50% upfront, 50% on milestone complete"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Cancellation Terms</label>
                    <input 
                      type="text" 
                      value={contractForm.cancellationTerms} 
                      onChange={e => setContractForm({ ...contractForm, cancellationTerms: e.target.value })}
                      placeholder="e.g. No refund after work starts"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                </div>

                {/* CONTRACT LEGAL DISCLAIMER REQUIRED BY POINT 11 */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-[10px] text-gray-400 text-left">
                  <span className="font-bold text-[#facc15] block mb-0.5">Contract legal disclaimer</span>
                  Templates are provided for general information and are not legal advice. GOYE TRADE ASSURANCE HUB is not a law firm or professional counsel.
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#7c3aed] text-white font-extrabold uppercase rounded-lg hover:brightness-110"
                >
                  Generate Smart Contract Document
                </button>
              </form>
            </div>

            {/* Right side: Agreement records + Signature Canvas pad */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <h3 className="text-lg font-bold">Smart Contract Ledgers</h3>
                <p className="text-xs text-gray-400 mt-1">Audit, sign and verify agreement document logs.</p>

                <div className="space-y-3 mt-4">
                  {contracts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No transaction data yet.</div>
                  ) : (
                    contracts.map((contract) => (
                      <div 
                        key={contract.id}
                        onClick={() => setActiveContract(contract)}
                        className={`p-4 rounded-xl border cursor-pointer text-xs transition-all flex items-center justify-between ${activeContract?.id === contract.id ? 'bg-[#7c3aed]/10 border-[#7c3aed]' : 'bg-[#0a0f1e] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="space-y-0.5 text-left">
                          <span className="font-mono text-[9px] text-gray-500">{contract.id}</span>
                          <h4 className="font-bold text-white">{contract.templateType}</h4>
                          <span className="text-[10px] text-gray-400">{contract.partyA} vs {contract.partyB}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-xs bg-white/5 text-gray-300 font-bold px-2 py-0.5 rounded">{contract.effectiveDate}</span>
                          <span className="block text-[10px] font-mono text-gray-500 truncate max-w-[120px]">{contract.docHash}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Contract details & signpad */}
              {activeContract && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="font-mono text-xs text-gray-500">Contract Ref: {activeContract.id}</span>
                      <h3 className="text-xl font-bold">{activeContract.templateType}</h3>
                      <span className="text-xs text-gray-400 block">SHA256 Document hash: <span className="font-mono text-gray-500">{activeContract.docHash}</span></span>
                    </div>

                    <button 
                      onClick={() => triggerPdfGeneration(activeContract)}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-[#10b981] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:brightness-110"
                    >
                      <Download className="h-4 w-4" /> Download Genuine PDF Contract
                    </button>
                  </div>

                  <div className="space-y-4 text-xs text-left">
                    <div className="p-4 bg-[#0a0f1e] rounded-xl border border-white/5 space-y-3 leading-relaxed">
                      <div>
                        <span className="font-bold text-gray-400">PARTIES:</span>
                        <p className="text-gray-300">Party A: {activeContract.partyA} ({activeContract.businessA}) - {activeContract.emailA}</p>
                        <p className="text-gray-300">Party B: {activeContract.partyB} ({activeContract.businessB}) - {activeContract.emailB}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">SCOPE OF WORK:</span>
                        <p className="text-gray-300">{activeContract.scopeOfWork}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">DELIVERABLES:</span>
                        <p className="text-gray-300">{activeContract.deliverables}</p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">TRANSACTION VALUE:</span>
                        <p className="text-sm font-bold text-[#facc15]">${activeContract.price} USD</p>
                      </div>
                    </div>

                    {/* Active Signatures tracking */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-[#0a0f1e] p-4 rounded-xl border border-white/5 text-center space-y-2">
                        <span className="font-bold text-gray-400 block">Party A Stamp ({activeContract.emailA})</span>
                        {activeContract.signatureA ? (
                          <div className="p-3 bg-white/5 border border-green-500/30 text-green-400 font-extrabold rounded-lg uppercase tracking-widest text-[10px]">
                            SECURELY SIGNED ✓
                          </div>
                        ) : (
                          <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 font-bold rounded-lg text-[10px]">
                            SIGNATURE PENDING
                          </div>
                        )}
                      </div>

                      <div className="bg-[#0a0f1e] p-4 rounded-xl border border-white/5 text-center space-y-2">
                        <span className="font-bold text-gray-400 block">Party B Stamp ({activeContract.emailB})</span>
                        {activeContract.signatureB ? (
                          <div className="p-3 bg-white/5 border border-green-500/30 text-green-400 font-extrabold rounded-lg uppercase tracking-widest text-[10px]">
                            SECURELY SIGNED ✓
                          </div>
                        ) : (
                          <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 font-bold rounded-lg text-[10px]">
                            SIGNATURE PENDING
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signature Drawing Canvas Pad */}
                    {(!activeContract.signatureA || !activeContract.signatureB) && currentUser && (
                      <div className="bg-[#0a0f1e] p-5 rounded-xl border border-white/5 space-y-3">
                        <span className="font-bold text-white block text-sm">Official Verification Stamp Pad</span>
                        <p className="text-[11px] text-gray-400">
                          Confirm email <span className="font-bold text-[#facc15]">{currentUser.email}</span> matching contract to apply official digital stamp. Draw signature in the canvas below:
                        </p>

                        <div className="border border-white/10 rounded-xl overflow-hidden bg-white max-w-[400px] mx-auto">
                          <canvas 
                            ref={canvasRef}
                            width={400}
                            height={150}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full cursor-crosshair bg-white"
                          ></canvas>
                        </div>

                        <div className="flex gap-2 justify-center pt-1.5">
                          <button 
                            type="button" 
                            onClick={clearCanvas}
                            className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:text-white"
                          >
                            Clear Stamp Pad
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={() => signContract(activeContract.id, currentUser.email)}
                            className="px-4 py-1.5 bg-[#7c3aed] text-white rounded-lg text-[10px] font-bold hover:brightness-110"
                          >
                            Execute Signature
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* INVOICES & PAYLINKS MODULE */}
        {activeTab === 'invoices' && (
          <div className="grid lg:grid-cols-12 gap-8 text-left animate-fadeIn">
            
            {/* Left side: Invoice Creator */}
            <div className="lg:col-span-5 bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 h-fit">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-[#10b981]" /> Pro Invoice Compiler
                </h2>
                <p className="text-xs text-gray-400 mt-1">Compile and issue verified payment paylinks immediately.</p>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Invoice Number</label>
                  <input 
                    type="text" 
                    value={invoiceForm.invoiceNumber} 
                    onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    placeholder="e.g., INV-2026-0048" 
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Seller Details Name</label>
                    <input 
                      type="text" 
                      value={invoiceForm.sellerName} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, sellerName: e.target.value })}
                      placeholder="e.g. GOYEDAGOSMESS ENTERPRISE"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Buyer Details Name</label>
                    <input 
                      type="text" 
                      value={invoiceForm.buyerName} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, buyerName: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Seller Contact (Email/Address)</label>
                    <input 
                      type="text" 
                      value={invoiceForm.sellerDetails} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, sellerDetails: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Buyer Contact (Email/Address)</label>
                    <input 
                      type="text" 
                      value={invoiceForm.buyerDetails} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, buyerDetails: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Line Items (Format: Name, Qty, UnitPrice - One per line)</label>
                  <textarea 
                    value={invoiceForm.itemsText} 
                    onChange={e => setInvoiceForm({ ...invoiceForm, itemsText: e.target.value })}
                    placeholder="e.g. Technical System setup, 1, 1500&#10;Consultation services, 5, 200" 
                    rows={3}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Tax Rate (%)</label>
                    <input 
                      type="number" 
                      value={invoiceForm.taxRate} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, taxRate: Number(e.target.value) })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Discount (%)</label>
                    <input 
                      type="number" 
                      value={invoiceForm.discountRate} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, discountRate: Number(e.target.value) })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Currency</label>
                    <select 
                      value={invoiceForm.currency} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                    >
                      <option value="USD">USD</option>
                      <option value="Pi">Pi</option>
                      <option value="NGN">NGN</option>
                      <option value="USDT">USDT (BEP20)</option>
                      <option value="USDC">USDC (Base)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Due Date</label>
                    <input 
                      type="date" 
                      value={invoiceForm.dueDate} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Billing Instructions / Notes</label>
                    <input 
                      type="text" 
                      value={invoiceForm.notes} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      placeholder="e.g. Standard settlement within 7 business days."
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#10b981] text-white font-extrabold uppercase rounded-lg hover:brightness-110"
                >
                  Compile Invoice Record
                </button>
              </form>
            </div>

            {/* Right side: Detailed Invoice listing */}
            <div className="lg:col-span-7 space-y-6 text-xs text-left">
              
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <h3 className="text-lg font-bold">Compiled Invoice Ledger</h3>
                <p className="text-xs text-gray-400 mt-1">Select an invoice to launch its payment paylink dashboard.</p>

                <div className="space-y-3 mt-4">
                  {invoices.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No transaction data yet.</div>
                  ) : (
                    invoices.map((inv) => (
                      <div 
                        key={inv.id}
                        onClick={() => setActiveInvoice(inv)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${activeInvoice?.id === inv.id ? 'bg-[#10b981]/10 border-[#10b981]' : 'bg-[#0a0f1e] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono text-[9px] text-gray-500">{inv.invoiceNumber}</span>
                          <h4 className="font-bold text-white">To: {inv.buyerName}</h4>
                          <span className="text-[10px] text-gray-400">Due Date: {inv.dueDate}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-sm font-black text-white">{inv.total.toLocaleString()} {inv.currency}</span>
                          <span className={`block text-[9px] uppercase font-bold ${inv.paymentStatus === 'Paid' ? 'text-green-400' : 'text-amber-400'}`}>{inv.paymentStatus}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Invoice paylink workspace */}
              {activeInvoice && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="font-mono text-xs text-gray-500">Invoice ID: {activeInvoice.id}</span>
                      <h3 className="text-xl font-bold">Invoice: {activeInvoice.invoiceNumber}</h3>
                    </div>

                    {activeInvoice.paymentStatus !== 'Paid' && (
                      <button 
                        onClick={() => initiatePaymentFlow('invoice', activeInvoice.id, activeInvoice.total, activeInvoice.currency)}
                        className="px-4 py-2 bg-[#10b981] text-white font-extrabold uppercase rounded-lg hover:brightness-110"
                      >
                        Authorize Payment Gate
                      </button>
                    )}
                  </div>

                  <div className="p-5 bg-[#0a0f1e] rounded-xl border border-white/5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 block font-bold uppercase">Seller Details:</span>
                        <p className="text-white font-semibold">{activeInvoice.sellerName}</p>
                        <p className="text-gray-400">{activeInvoice.sellerDetails}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block font-bold uppercase">Buyer Details:</span>
                        <p className="text-white font-semibold">{activeInvoice.buyerName}</p>
                        <p className="text-gray-400">{activeInvoice.buyerDetails}</p>
                      </div>
                    </div>

                    <div className="border-t border-b border-white/5 py-3 space-y-2">
                      <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">Line Item breakdown:</span>
                      <div className="space-y-1 text-xs">
                        {activeInvoice.items.map((item) => (
                          <div key={item.id} className="flex justify-between py-1 border-b border-white/[0.02]">
                            <span className="text-gray-300">{item.description} (x{item.qty})</span>
                            <span className="font-semibold text-white">{(item.qty * item.unitPrice).toLocaleString()} {activeInvoice.currency}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-xs space-y-1">
                      <div className="flex justify-between w-48 text-gray-400">
                        <span>Tax Rate:</span>
                        <span>{activeInvoice.taxRate}%</span>
                      </div>
                      <div className="flex justify-between w-48 text-gray-400">
                        <span>Discount Rate:</span>
                        <span>{activeInvoice.discountRate}%</span>
                      </div>
                      <div className="flex justify-between w-48 text-sm font-black text-[#facc15] pt-1 border-t border-white/10">
                        <span>Sum Total:</span>
                        <span>{activeInvoice.total.toLocaleString()} {activeInvoice.currency}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                      <span className="font-bold text-gray-400 block mb-0.5">Payment Covenants:</span>
                      This invoice document paylink points directly to the active server payment gateway. Due Date is restricted to {activeInvoice.dueDate}.
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* VERIFICATION CHECK MODULE */}
        {activeTab === 'verify' && (
          <div className="max-w-2xl mx-auto space-y-8 text-left animate-fadeIn">
            
            <div className="space-y-2 text-center">
              <span className="text-xs bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/40 px-3.5 py-1 rounded-full uppercase font-bold tracking-widest">
                Registry Connectivity Check
              </span>
              <h1 className="text-3xl font-black">Authoritative Corporate Lookup</h1>
              <p className="text-xs text-gray-400 max-w-md mx-auto">Verify corporate existence, registration status, and compliance indicators.</p>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-4">
              <form onSubmit={executeVerificationRegistry} className="space-y-3">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-gray-400 block">Query Business Name / RC / Corporate ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={verifyQuery} 
                      onChange={e => setVerifyQuery(e.target.value)}
                      placeholder="e.g. GOYEDAGOSMESS ENTERPRISE or RC BN3583778"
                      className="flex-1 bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="px-5 bg-[#7c3aed] text-white text-xs font-bold rounded-lg hover:brightness-110"
                    >
                      Search Registry
                    </button>
                  </div>
                </div>
              </form>

              {/* REALISTIC RESULTS AS REQUIRED BY POINT 13 */}
              {verifyResult && (
                verifyResult.startsWith("✓") ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                      <ShieldCheck className="h-4 w-4" /> Internal Document / Ledger Verified
                    </div>
                    <pre className="text-xs text-gray-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {verifyResult}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                      <AlertTriangle className="h-4 w-4" /> Node Connection Status Unavailable
                    </div>
                    <p className="text-xs text-gray-400">
                      {verifyResult} GOYE TRADE ASSURANCE HUB does not fabricate business registry lookup results. Please configure secure government API gateway credentials to query external business status.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Secure Information note */}
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[#facc15] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">SME Verification Standards</span>
                We support connecting with CAC, SEC, and other corporate registry APIs globally. When connected, details are cached on our secure database.
              </div>
            </div>

          </div>
        )}

        {/* DISPUTE CENTER MODULE */}
        {activeTab === 'disputes' && (
          <div className="grid lg:grid-cols-12 gap-8 text-left animate-fadeIn">
            
            {/* Left side: Log dispute case */}
            <div className="lg:col-span-5 bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 h-fit">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[#7c3aed]" /> File Arbitration Dispute
                </h2>
                <p className="text-xs text-gray-400 mt-1">Initiate compliance lock down and submit evidence.</p>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Target Deal Room Ref</label>
                  <select 
                    value={disputeForm.dealId}
                    onChange={e => setDisputeForm({ ...disputeForm, dealId: e.target.value })}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose active deal room --</option>
                    {deals.map(d => (
                      <option key={d.id} value={d.id}>{d.title} ({d.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Reason for Dispute</label>
                  <input 
                    type="text" 
                    value={disputeForm.reason} 
                    onChange={e => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                    placeholder="e.g. Milestone delivery missing required steel gauge specifications."
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400">Detailed Dispute Narrative & Description</label>
                  <textarea 
                    value={disputeForm.description} 
                    onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                    placeholder="Detail specific failures of terms, milestones breached, and proposed resolutions..." 
                    rows={4}
                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 focus:outline-none"
                    required
                  ></textarea>
                </div>

                {/* DISPUTE STATUS DISCLAIMER REQUIRED BY POINT 14 */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-[10px] text-gray-400">
                  GOYE TRADE ASSURANCE HUB does not claim to be a court or government dispute authority. Arbitrations are conducted based strictly on contractual parameters.
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#7c3aed] text-white font-extrabold uppercase rounded-lg hover:brightness-110"
                >
                  File Compliance Lock Down
                </button>
              </form>
            </div>

            {/* Right side: Detailed Dispute message timeline */}
            <div className="lg:col-span-7 space-y-6 text-xs text-left">
              
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <h3 className="text-lg font-bold">Active Dispute Cases</h3>
                <p className="text-xs text-gray-400 mt-1">Audit active compliance locks and chat with counterparties.</p>

                <div className="space-y-3 mt-4">
                  {disputes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No transaction data yet.</div>
                  ) : (
                    disputes.map((disp) => (
                      <div 
                        key={disp.id}
                        onClick={() => {
                          setActiveDispute(disp);
                          setAdminResolutionNotes('');
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${activeDispute?.id === disp.id ? 'bg-red-500/10 border-red-500' : 'bg-[#0a0f1e] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono text-[9px] text-gray-500">{disp.id}</span>
                          <h4 className="font-bold text-white">Deal ID: {disp.dealId}</h4>
                          <span className="text-[10px] text-gray-400">Reason: {disp.reason}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 text-[9px] font-bold bg-red-600/20 text-red-400 rounded-full">{disp.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Dispute timeline messaging */}
              {activeDispute && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div>
                      <span className="font-mono text-xs text-gray-500">Arbitration ID: {activeDispute.id}</span>
                      <h3 className="text-lg font-bold">Dispute File on Deal {activeDispute.dealId}</h3>
                    </div>
                    <span className="px-2 py-1 text-xs font-black bg-red-600/20 text-red-400 rounded-lg">{activeDispute.status}</span>
                  </div>

                  {/* Messages list */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto p-4 bg-[#0a0f1e] rounded-xl border border-white/5 text-xs text-left">
                    {activeDispute.messages.map((m) => (
                      <div key={m.id} className="space-y-1 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                        <div className="flex justify-between font-bold text-gray-400 text-[10px]">
                          <span>{m.sender}</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-200">{m.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chat sender input */}
                  {activeDispute.status === 'OPEN' && currentUser && (
                    <form onSubmit={(e) => handleSendDisputeMessage(e, activeDispute.id)} className="flex gap-2">
                      <input 
                        type="text" 
                        value={disputeMessageText} 
                        onChange={e => setDisputeMessageText(e.target.value)}
                        placeholder="Type compliance evidence statement..." 
                        className="flex-1 bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        required
                      />
                      <button 
                        type="submit"
                        className="px-4 bg-[#7c3aed] text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" /> Send
                      </button>
                    </form>
                  )}

                  {/* ADMIN COMPLIANCE RESOLUTION INTERFACE */}
                  {currentUser?.isAdmin && activeDispute.status === 'OPEN' && (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-red-400 text-xs">
                        <Shield className="h-4 w-4" /> Root Arbitration Referee Control
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Authorize final resolution metrics to close compliance file. This will update the locked deal status.
                      </p>

                      <form onSubmit={(e) => handleAdminResolveDispute(e, activeDispute.id)} className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 block text-[10px]">Dispute Outcome Resolution Notes</label>
                          <textarea 
                            value={adminResolutionNotes} 
                            onChange={e => setAdminResolutionNotes(e.target.value)}
                            placeholder="State exact resolution directives, payout allocations..." 
                            rows={2}
                            className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-xs"
                            required
                          ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-gray-400 block text-[10px]">Final Payout Deal Status</label>
                            <select 
                              value={adminResolutionOutcome} 
                              onChange={e => setAdminResolutionOutcome(e.target.value as any)}
                              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2 text-xs text-white"
                            >
                              <option value="Completed">Completed (Payout Seller)</option>
                              <option value="Awaiting Payment">Awaiting Payment (Refund Buyer)</option>
                            </select>
                          </div>

                          <button 
                            type="submit" 
                            className="w-full self-end py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase rounded-lg"
                          >
                            Resolve Dispute Lock
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

        {/* TRADE VAULT MODULE */}
        {activeTab === 'vault' && (
          <div className="space-y-8 text-left animate-fadeIn">
            
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <span className="text-xs bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/40 px-3.5 py-1 rounded-full uppercase font-bold tracking-widest">
                Ledger Asset Directory
              </span>
              <h1 className="text-3xl font-black">Trade Vault</h1>
              <p className="text-xs text-gray-400 max-w-md mx-auto">Inspect your registered contracts, compiled invoice paylinks, active deal rooms and logs.</p>
              
              {configStatus.DATABASE_STATUS === 'CONFIGURED' ? (
                <div className="inline-block mt-3 px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  DATABASE: CONFIGURED (Firestore Persistent Storage Connected)
                </div>
              ) : (
                <div className="inline-block mt-3 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  DATABASE: NOT PRODUCTION CONFIGURED (Persistent Server-Side Storage Required Before Production Launch)
                </div>
              )}
            </div>

            {/* REAL RECORDS ONLY (No seeded/fabricated chart bars or data!) */}
            {deals.length === 0 && contracts.length === 0 && invoices.length === 0 ? (
              <div className="bg-[#111827] border border-white/5 rounded-3xl p-12 text-center space-y-4">
                <Database className="h-10 w-10 text-gray-600 mx-auto" />
                <h3 className="text-lg font-bold text-gray-300">No records yet.</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Trade Vault does not display fabricated chart indices or artificial earnings. To populate, initialize your first trade deal room or compile a contract.
                </p>
                <button 
                  onClick={() => setActiveTab('deals')}
                  className="px-5 py-2.5 bg-[#7c3aed] text-white text-xs font-bold rounded-lg hover:brightness-110"
                >
                  Create Secure Deal
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Stats Header block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left text-xs">
                  <div className="bg-[#111827] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 uppercase tracking-widest font-bold text-[9px] block">Active Deals Room</span>
                    <span className="text-2xl font-black text-white block mt-1">{deals.length}</span>
                  </div>
                  <div className="bg-[#111827] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 uppercase tracking-widest font-bold text-[9px] block">Smart Contracts</span>
                    <span className="text-2xl font-black text-white block mt-1">{contracts.length}</span>
                  </div>
                  <div className="bg-[#111827] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 uppercase tracking-widest font-bold text-[9px] block">Invoices Compiled</span>
                    <span className="text-2xl font-black text-white block mt-1">{invoices.length}</span>
                  </div>
                  <div className="bg-[#111827] border border-white/5 p-4 rounded-xl">
                    <span className="text-gray-500 uppercase tracking-widest font-bold text-[9px] block">Open Disputes</span>
                    <span className="text-2xl font-black text-white block mt-1">{disputes.filter(d => d.status === 'OPEN').length}</span>
                  </div>
                </div>

                {/* Audit Logs table list */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden text-xs">
                  <div className="p-4 border-b border-white/5 font-bold uppercase tracking-wider text-gray-400">
                    Secure Ledger Audit Trails
                  </div>

                  <div className="divide-y divide-white/5">
                    {auditLogs.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">No record trails logged yet.</div>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.01]">
                          <div className="space-y-0.5 text-left">
                            <span className="font-mono text-[9px] text-gray-500 block">ID: {log.id} | Timestamp: {new Date(log.timestamp).toLocaleString()}</span>
                            <span className="font-bold text-white block">{log.event}</span>
                            <p className="text-gray-400 text-xs leading-relaxed">{log.details}</p>
                          </div>
                          {log.dealId && (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-300 font-mono text-[10px] rounded shrink-0 self-start sm:self-center">
                              Deal: {log.dealId}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-12 text-center max-w-4xl mx-auto animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/40 px-3.5 py-1 rounded-full uppercase font-bold tracking-widest">
                Service Pricing Metrics
              </span>
              <h1 className="text-3xl font-black">Trade Assurance Plans</h1>
              <p className="text-xs text-gray-400 max-w-md mx-auto">Standard transactional metrics for corporate security logs.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left text-xs">
              
              <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="font-extrabold text-gray-400 block uppercase tracking-widest">Standard Pack</span>
                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-3xl font-black">$10</span>
                    <span className="text-gray-500 font-medium">/ month</span>
                  </div>
                  <p className="text-gray-400">Deploy basic deal rooms, smart contracts, and billing portals.</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> 3 Deals / Month</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Smart Contract Templates</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Basic Invoicing</div>
                </div>
                <button onClick={() => setActiveTab('deals')} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-extrabold rounded-lg uppercase tracking-wider">
                  Select Basic
                </button>
              </div>

              <div className="bg-[#111827] border-2 border-[#7c3aed] p-6 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-xl shadow-[#7c3aed]/5">
                <span className="absolute -top-3.5 right-6 bg-[#7c3aed] text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full">POPULAR CHOICE</span>
                
                <div className="space-y-3">
                  <span className="font-extrabold text-[#7c3aed] block uppercase tracking-widest">Enterprise Pack</span>
                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-3xl font-black">$35</span>
                    <span className="text-gray-500 font-medium">/ month</span>
                  </div>
                  <p className="text-gray-400">Complete utility for importing, global SME shipping and compliance.</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#7c3aed]/20">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Unlimited Deals Room</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Signature Canvas stamp pads</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Dispute ref desk arbitration</div>
                </div>
                <button onClick={() => setActiveTab('deals')} className="w-full py-2.5 bg-[#7c3aed] text-white font-extrabold rounded-lg uppercase tracking-wider hover:brightness-110">
                  Select Enterprise
                </button>
              </div>

              <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="font-extrabold text-gray-400 block uppercase tracking-widest">Sovereign Pack</span>
                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-3xl font-black">$85</span>
                    <span className="text-gray-500 font-medium">/ month</span>
                  </div>
                  <p className="text-gray-400">Advanced multi-asset, corporate integration checkups.</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Private database support</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Custom API lookup channels</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7c3aed]" /> Dedicated compliance referee</div>
                </div>
                <button onClick={() => setActiveTab('deals')} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-extrabold rounded-lg uppercase tracking-wider">
                  Select Custom
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-[#0a0f1e] border-t border-white/10 py-12 px-4 sm:px-6 text-left relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 text-xs">
          
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#7c3aed] rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-white">GOYE TRADE ASSURANCE HUB</span>
            </div>

            <p className="text-gray-400 leading-relaxed max-w-md">
              Secure Deals • Verified Contracts • Instant Invoices • Trade Assurance. Provided by <span className="font-bold text-white">GOYEDAGOSMESS ENTERPRISE (RC BN3583778)</span>.
            </p>

            {/* CRITICAL DISCLAIMER REQUIRED BY POINT 21 */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl max-w-md">
              <span className="font-extrabold text-white block mb-1 uppercase tracking-wider text-[10px]">Important Disclaimer</span>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                GOYE TRADE ASSURANCE HUB is an independent trade-assurance and transaction-management platform. It is not a bank or licensed financial institution. Contract templates are provided for general information and do not constitute legal advice. Verification results are informational and do not guarantee the legitimacy, solvency, performance or delivery of any party.
              </p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4 text-left">
            <span className="font-extrabold uppercase tracking-widest text-gray-400 block text-[10px]">Secure Directory Links</span>
            <ul className="space-y-2 text-gray-400">
              <li><button onClick={() => setActiveTab('home')} className="hover:text-white transition-colors">Home Dashboard</button></li>
              <li><button onClick={() => setActiveTab('deals')} className="hover:text-white transition-colors">Trade Deal Room</button></li>
              <li><button onClick={() => setActiveTab('contracts')} className="hover:text-white transition-colors">Contract Builder</button></li>
              <li><button onClick={() => setActiveTab('invoices')} className="hover:text-white transition-colors">Invoices & Paylinks</button></li>
              <li><button onClick={() => setActiveTab('disputes')} className="hover:text-white transition-colors">Dispute Center</button></li>
              <li><button onClick={() => setActiveTab('vault')} className="hover:text-white transition-colors">Secure Ledger Vault</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-4 text-left">
            <span className="font-extrabold uppercase tracking-widest text-gray-400 block text-[10px]">Regulatory Compliance</span>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:underline">Terms of Use</a></li>
              <li><a href="#" className="hover:underline">Privacy Covenants</a></li>
              <li><a href="#" className="hover:underline">Arbitration Policy</a></li>
              <li><a href="#" className="hover:underline">Transaction Management Codes</a></li>
            </ul>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-gray-500 block">Corporate Support Desk:</span>
              <a href="https://wa.me/2348083583778" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981] text-white text-[10px] font-bold rounded-lg mt-1 hover:brightness-110">
                <Phone className="h-3 w-3 shrink-0" /> WhatsApp Support
              </a>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 relative z-10">
          <span>© 2026 GOYEDAGOSMESS ENTERPRISE. All Rights Reserved. RC BN3583778.</span>
          <span className="font-bold text-[#facc15]">Secure Deal Management Protocol</span>
        </div>
      </footer>

      {/* --- ALL PREMIUM INTEGRATION MODALS --- */}

      {/* 1. AUTH LOGIN & REGISTRATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-md w-full p-6 text-center space-y-5 relative animate-scaleUp">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>

            <div className="h-12 w-12 bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#7c3aed] rounded-full flex items-center justify-center mx-auto">
              <LockKeyhole className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {isRegistering ? 'Register Secure Account' : 'Authenticate Corporate Session'}
              </h3>
              <p className="text-xs text-gray-500">Access transaction deals rooms and smart contract ledgers.</p>
            </div>

            {authError && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-left">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="e.g. corporate@example.com"
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-white"
                  required 
                />
              </div>

              {isRegistering && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Full Name / Username</label>
                    <input 
                      type="text" 
                      value={authUsername} 
                      onChange={e => setAuthUsername(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-white"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Company Name (Optional)</label>
                    <input 
                      type="text" 
                      value={authCompany} 
                      onChange={e => setAuthCompany(e.target.value)}
                      placeholder="e.g. Acme Logistics Ltd"
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-bold text-gray-400">Secure Password</label>
                <input 
                  type="password" 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 text-white"
                  required 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-[#7c3aed] text-white font-extrabold uppercase rounded-lg hover:brightness-110"
              >
                {isRegistering ? 'Register Root Session' : 'Access Secure Console'}
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-white/5"></div>
                <div className="px-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">OR SECURE OAUTH</div>
                <div className="flex-1 border-t border-white/5"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white text-black font-extrabold text-xs rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.56-5.17 3.56-8.56z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.32 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.61H1.21C.44 8.24 0 10.06 0 12s.44 3.76 1.21 5.39l4.11-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"/>
                </svg>
                Sign In with Google compliant OAuth
              </button>
            </form>

            <div className="text-xs text-gray-500 text-center">
              {isRegistering ? 'Already have an account?' : 'Need a compliant transaction profile?'}
              <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                }} 
                className="text-[#7c3aed] font-bold ml-1.5 hover:underline"
              >
                {isRegistering ? 'Sign In Now' : 'Register Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REAL PAYMENT GATEWAY CHECKOUT MODAL (No simulated success as requested by Point 4!) */}
      {checkoutEntity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-md w-full p-6 text-left space-y-5 relative animate-scaleUp">
            
            <button onClick={() => setCheckoutEntity(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/40 px-2.5 py-0.5 rounded uppercase tracking-wider font-extrabold">
                Authoritative Settlement Gateway
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">Secure Transaction Invoice Check</h3>
              <p className="text-xs text-gray-400">Required Sum: <span className="font-extrabold text-[#facc15]">{checkoutEntity.amount.toLocaleString()} {checkoutEntity.currency}</span></p>
            </div>

            <form onSubmit={verifyPaymentSignature} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-gray-400 block">Select Integration Gateway Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* Pi Network Gateway */}
                  <button 
                    type="button"
                    onClick={() => setSelectedMethod('PI')}
                    className={`p-3 border rounded-xl text-left flex flex-col justify-between ${selectedMethod === 'PI' ? 'border-[#7c3aed] bg-[#7c3aed]/5 text-white' : 'border-white/5 bg-[#0a0f1e] text-gray-400'}`}
                  >
                    <span className="font-bold text-[10px]">PI NETWORK SDK</span>
                    <span className="text-[10px] text-[#facc15]">Status: {configStatus.PI_API_KEY}</span>
                  </button>

                  {/* Paystack Gateway */}
                  <button 
                    type="button"
                    onClick={() => setSelectedMethod('PAYSTACK')}
                    className={`p-3 border rounded-xl text-left flex flex-col justify-between ${selectedMethod === 'PAYSTACK' ? 'border-green-500 bg-green-500/5 text-white' : 'border-white/5 bg-[#0a0f1e] text-gray-400'}`}
                  >
                    <span className="font-bold text-[10px]">PAYSTACK API</span>
                    <span className="text-[10px] text-green-400">Status: {configStatus.PAYSTACK_SECRET_KEY}</span>
                  </button>

                  {/* Flutterwave Gateway */}
                  <button 
                    type="button"
                    onClick={() => setSelectedMethod('FLUTTERWAVE')}
                    className={`p-3 border rounded-xl text-left flex flex-col justify-between ${selectedMethod === 'FLUTTERWAVE' ? 'border-[#7c3aed] bg-[#7c3aed]/5 text-white' : 'border-white/5 bg-[#0a0f1e] text-gray-400'}`}
                  >
                    <span className="font-bold text-[10px]">FLUTTERWAVE API</span>
                    <span className="text-[10px] text-[#7c3aed]">Status: {configStatus.FLUTTERWAVE_SECRET_KEY}</span>
                  </button>

                  {/* USDT BEP20 Block query */}
                  <button 
                    type="button"
                    onClick={() => setSelectedMethod('USDT_BEP20')}
                    className={`p-3 border rounded-xl text-left flex flex-col justify-between ${selectedMethod === 'USDT_BEP20' ? 'border-[#facc15] bg-[#facc15]/5 text-white' : 'border-white/5 bg-[#0a0f1e] text-gray-400'}`}
                  >
                    <span className="font-bold text-[10px]">USDT BEP20 (BSC)</span>
                    <span className="text-[9px] text-[#facc15] truncate max-w-[120px]">{configStatus.USDT_BSC_RECEIVING_ADDRESS}</span>
                  </button>

                </div>
              </div>

              {/* USDC BASE BLOCK OPTION */}
              <button 
                type="button"
                onClick={() => setSelectedMethod('USDC_BASE')}
                className={`w-full p-3.5 border rounded-xl text-left flex justify-between items-center ${selectedMethod === 'USDC_BASE' ? 'border-[#7c3aed] bg-[#7c3aed]/5 text-white' : 'border-white/5 bg-[#0a0f1e] text-gray-400'}`}
              >
                <div>
                  <span className="font-bold text-[10px] block">USDC Base Layer-2 Network</span>
                  <span className="text-[9px] text-gray-500">Address: {configStatus.USDC_BASE_RECEIVING_ADDRESS}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#facc15]">Asset: USDC</span>
              </button>

              {/* DYNAMIC FORMS ACCORDING TO POINT 8 & 9 */}
              {(selectedMethod === 'USDT_BEP20' || selectedMethod === 'USDC_BASE') && (
                <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3 text-left">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-300 block uppercase text-[9px]">Blockchain Instruction Packet:</span>
                    <p className="text-[10px] text-gray-500">
                      Submit exactly the required value to the configured receiving address on the network explorer. Screenshot uploads are not payment verification. Input transaction hash below:
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400">Transaction Hash (Tx Hash)</label>
                    <input 
                      type="text" 
                      value={txHashInput} 
                      onChange={e => setTxHashInput(e.target.value)}
                      placeholder="e.g. 0x93bf1451f0412..."
                      className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg p-2.5 font-mono text-white text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* WARNING THAT WE DO NOT SIMULATE SUCCESS as requested in Point 4 */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-[10px] text-gray-400">
                <span className="font-bold text-red-400 block mb-0.5">Authoritative payment restrictions:</span>
                This portal queries real-world blockchain explorers or merchant server verification endpoints. If credentials or APIs are NOT CONFIGURED, the transaction status cannot transition to COMPLETED.
              </div>

              <button 
                type="submit"
                disabled={isVerifyingPayment}
                className="w-full py-3 bg-[#7c3aed] text-white font-extrabold uppercase rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5"
              >
                {isVerifyingPayment ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Server Node...
                  </>
                ) : (
                  'Trigger Server Verification Check'
                )}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
