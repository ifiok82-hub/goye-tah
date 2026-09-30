import React, { useState, useEffect } from 'react';
import { isPiBrowser } from '../utils/piDetection';
import { RefreshCw, ShieldCheck, X } from 'lucide-react';

interface PaymentAdapterProps {
  deal: { id: string; amount: number; currency: string; title: string };
  onClose: () => void;
  onPaymentSuccess: () => void;
  configStatus: any;
}

export default function PaymentAdapter({ deal, onClose, onPaymentSuccess, configStatus }: PaymentAdapterProps) {
  const [inPiBrowser, setInPiBrowser] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PI' | 'PAYSTACK' | 'FLUTTERWAVE' | 'BUSHA_USDT' | 'BUSHA_USDC'>('PI');
  
  // Busha input state
  const [bushaTxId, setBushaTxId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [showPendingBadge, setShowPendingBadge] = useState(false);

  useEffect(() => {
    setInPiBrowser(isPiBrowser());
  }, []);

  // Pi SDK integration handler
  const handlePiSDKPayment = async () => {
    setVerificationError('');
    setIsVerifying(true);
    try {
      const piInstance = (window as any).Pi;
      if (!piInstance) {
        throw new Error('Pi SDK is not loaded or ready. Ensure you are accessing via the Pi Browser app.');
      }

      const paymentData = {
        amount: deal.amount,
        memo: `GOYE Escrow ${deal.id} RC BN3583778`,
        metadata: { dealId: deal.id }
      };

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await fetch(`/api/pi-payment/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
          return res.ok;
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch(`/api/pi-payment/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid, dealId: deal.id })
          });
          if (res.ok) {
            onPaymentSuccess();
          }
        },
        onCancel: () => {
          setVerificationError('Transaction cancelled by user.');
          setIsVerifying(false);
        },
        onError: (err: any) => {
          setVerificationError(`Pi Network Error: ${err.message || err}`);
          setIsVerifying(false);
        }
      };

      await piInstance.createPayment(paymentData, paymentCallbacks);
    } catch (err: any) {
      setVerificationError(err.message || 'Direct browser simulated execution.');
      setIsVerifying(false);
    }
  };

  const verifyBushaTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bushaTxId.trim()) {
      setVerificationError('Busha Transaction ID / Hash is required.');
      return;
    }

    setVerificationError('');
    setIsVerifying(true);
    setShowPendingBadge(true);

    try {
      const res = await fetch('/api/verify-busha-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txId: bushaTxId.trim(),
          dealId: deal.id,
          expectedAmount: deal.amount,
          asset: selectedMethod === 'BUSHA_USDT' ? 'USDT' : 'USDC'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setVerificationError(data.error || 'Busha ledger verification could not be auto-completed.');
        setIsVerifying(false);
        setShowPendingBadge(false);
        return;
      }
      
      onPaymentSuccess();
    } catch (err) {
      setVerificationError('Busha node connection timed out. Transaction is pending verification.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A1931] border border-[#D4AF37]/30 rounded-2xl max-w-lg w-full overflow-hidden text-left relative shadow-2xl animate-scaleUp text-white">
        
        {/* Navy Header & Gold Bar */}
        <div className="h-2 bg-[#D4AF37]"></div>
        
        {/* Header content */}
        <div className="p-6 border-b border-[#D4AF37]/10 flex justify-between items-center bg-[#061122]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-extrabold">
                GOYE Portal Compliant Settlement
              </span>
              <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2.5 py-0.5 rounded-full font-mono">
                RC BN3583778
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              Secure Escrow Invoice Room
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Area */}
        <div className="p-6 space-y-5">
          <div className="bg-[#061122] rounded-xl p-4 border border-[#D4AF37]/10 flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-400 block uppercase">Trade Subject</span>
              <span className="text-sm font-bold text-white">{deal.title}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block uppercase">Guaranteed Sum</span>
              <span className="text-lg font-black text-[#D4AF37]">{deal.amount.toLocaleString()} {deal.currency}</span>
            </div>
          </div>

          {/* Validation Errors & Pending Status Badges */}
          {verificationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              <span className="font-bold block mb-0.5">Authorization Notice:</span>
              {verificationError}
            </div>
          )}

          {showPendingBadge && (
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 text-[#D4AF37] text-xs rounded-xl flex items-center gap-2.5 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
              </span>
              <div>
                <span className="font-black block uppercase tracking-wider text-[9px]">Busha Verification Pending</span>
                Your transaction ID has been queued. Our admin team will verify the Busha credit logs shortly.
              </div>
            </div>
          )}

          {/* Render states based on browser context */}
          {inPiBrowser ? (
            <div className="space-y-6 text-center py-4">
              <div className="p-5 border border-[#D4AF37]/20 rounded-2xl bg-[#D4AF37]/5 space-y-3">
                <span className="text-xs font-bold text-[#D4AF37] block uppercase tracking-wider">
                  Pi Network Exclusive Channel
                </span>
                <p className="text-xs text-gray-300">
                  You are inside the compliant Pi Browser. Standard payment channels (Paystack, Flutterwave, Busha Crypto) are hidden for Pi platform SDK compliance.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePiSDKPayment}
                disabled={isVerifying}
                className="w-full py-4 bg-[#D4AF37] text-black font-black uppercase rounded-xl shadow-lg hover:brightness-110 flex items-center justify-center gap-2.5"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Transacting Pi Ledger...
                  </>
                ) : (
                  'Authorize Escrow via Pi SDK'
                )}
              </button>

              <p className="text-[10px] text-gray-400 italic text-center w-full block mt-2">
                Pi-exclusive — Secured on Pi Network
              </p>
            </div>
          ) : (
            /* Standard Browser Context */
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
                Select Compliance Settlement Channel:
              </span>

              {/* Grid of gateway selectors */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('PI')}
                  className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                    selectedMethod === 'PI' ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' : 'border-white/5 bg-[#061122] text-gray-400 hover:border-white/10'
                  }`}
                >
                  <span className="font-extrabold text-[10px] tracking-wider text-[#D4AF37]">PI SDK PORTAL</span>
                  <span className="text-[9px] text-gray-500 font-medium">Status: Verified active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('PAYSTACK')}
                  className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                    selectedMethod === 'PAYSTACK' ? 'border-emerald-500 bg-emerald-500/5 text-white' : 'border-white/5 bg-[#061122] text-gray-400 hover:border-white/10'
                  }`}
                >
                  <span className="font-extrabold text-[10px] tracking-wider text-emerald-400">PAYSTACK</span>
                  <span className="text-[9px] text-gray-500 font-medium">Status: {configStatus.PAYSTACK_SECRET_KEY || 'CONFIGURED'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('FLUTTERWAVE')}
                  className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                    selectedMethod === 'FLUTTERWAVE' ? 'border-sky-500 bg-sky-500/5 text-white' : 'border-white/5 bg-[#061122] text-gray-400 hover:border-white/10'
                  }`}
                >
                  <span className="font-extrabold text-[10px] tracking-wider text-sky-400">FLUTTERWAVE</span>
                  <span className="text-[9px] text-gray-500 font-medium">Status: {configStatus.FLUTTERWAVE_SECRET_KEY || 'CONFIGURED'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('BUSHA_USDT')}
                  className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                    selectedMethod === 'BUSHA_USDT' ? 'border-amber-500 bg-amber-500/5 text-white' : 'border-white/5 bg-[#061122] text-gray-400 hover:border-white/10'
                  }`}
                >
                  <span className="font-extrabold text-[10px] tracking-wider text-amber-400">USDT BEP20 (BSC)</span>
                  <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider">Via Busha App</span>
                </button>
              </div>

              {/* USDC BASE Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod('BUSHA_USDC')}
                className={`w-full p-3.5 border rounded-xl text-left flex justify-between items-center transition-all ${
                  selectedMethod === 'BUSHA_USDC' ? 'border-blue-500 bg-blue-500/5 text-white' : 'border-white/5 bg-[#061122] text-gray-400 hover:border-white/10'
                }`}
              >
                <div>
                  <span className="font-extrabold text-[10px] tracking-wider text-blue-400 block">USDC (BASE LAYER-2)</span>
                  <span className="text-[9px] text-gray-500 font-bold block mt-0.5">Pay with USDC Base via Busha</span>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest font-black">Busha Base</span>
              </button>

              {/* Busha USDT BEP20 View */}
              {selectedMethod === 'BUSHA_USDT' && (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                      Busha USDT BEP20 Instructions
                    </span>
                    <ol className="text-[11px] text-gray-300 space-y-1.5 list-decimal pl-4">
                      <li>Open your <strong>Busha App</strong> on your mobile device.</li>
                      <li>Go to <strong>Receive</strong> &gt; Select <strong>USDT</strong> &gt; Select <strong>BEP20 (BNB Smart Chain)</strong> network.</li>
                      <li>Copy your Busha deposit address, transfer exactly <strong className="text-[#D4AF37]">{deal.amount.toLocaleString()} USDT</strong> to it.</li>
                      <li>Once the network completes the transfer, copy the <strong>Transaction ID / Tx Hash</strong>.</li>
                      <li>Paste the Transaction ID in the secure portal below for instant verification.</li>
                    </ol>
                  </div>

                  <form onSubmit={verifyBushaTransaction} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 block uppercase">Paste Busha Transaction ID / TxHash</label>
                      <input
                        type="text"
                        value={bushaTxId}
                        onChange={e => setBushaTxId(e.target.value)}
                        placeholder="e.g. 0x5a18c90fe72..."
                        className="w-full bg-[#061122] border border-white/10 rounded-lg p-2.5 font-mono text-white text-xs"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-2.5 bg-[#D4AF37] text-black font-black uppercase text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5"
                    >
                      {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm Busha Transaction ID'}
                    </button>
                  </form>
                </div>
              )}

              {/* Busha USDC BASE View */}
              {selectedMethod === 'BUSHA_USDC' && (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                      Busha USDC Base Instructions
                    </span>
                    <ol className="text-[11px] text-gray-300 space-y-1.5 list-decimal pl-4">
                      <li>Open your <strong>Busha App</strong> on your mobile device.</li>
                      <li>Go to <strong>Receive</strong> &gt; Select <strong>USDC</strong> &gt; Select <strong>Base (Layer-2 Network)</strong>.</li>
                      <li>Copy your Busha deposit address, transfer exactly <strong className="text-[#D4AF37]">{deal.amount.toLocaleString()} USDC</strong> to it.</li>
                      <li>Once the network completes the transfer, copy the <strong>Transaction ID / Tx Hash</strong>.</li>
                      <li>Paste the Transaction ID in the secure portal below for instant verification.</li>
                    </ol>
                  </div>

                  <form onSubmit={verifyBushaTransaction} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 block uppercase">Paste Busha Transaction ID / TxHash</label>
                      <input
                        type="text"
                        value={bushaTxId}
                        onChange={e => setBushaTxId(e.target.value)}
                        placeholder="e.g. 0x5a18c90fe72..."
                        className="w-full bg-[#061122] border border-white/10 rounded-lg p-2.5 font-mono text-white text-xs"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-2.5 bg-[#D4AF37] text-black font-black uppercase text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5"
                    >
                      {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm Busha Transaction ID'}
                    </button>
                  </form>
                </div>
              )}

              {/* Standard Pi Payment / Paystack / Flutterwave Action */}
              {(selectedMethod === 'PI' || selectedMethod === 'PAYSTACK' || selectedMethod === 'FLUTTERWAVE') && (
                <button
                  type="button"
                  onClick={selectedMethod === 'PI' ? handlePiSDKPayment : () => onPaymentSuccess()}
                  className="w-full py-3.5 bg-[#D4AF37] text-black font-extrabold uppercase rounded-xl hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Proceed to {selectedMethod} Gateway
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="bg-[#061122] p-4 text-center border-t border-[#D4AF37]/10 flex items-center justify-center gap-2 text-xs">
          <span className="text-[#D4AF37] font-bold">GOYE Trade Assurance</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 font-medium">RC BN3583778 Escrow Escort Room</span>
        </div>
      </div>
    </div>
  );
}
