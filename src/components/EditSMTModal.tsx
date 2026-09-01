import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, Image, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { SMTPerformance, ComputedSMT } from '../types';
import { formatRupiah, formatPercent, getGoogleDriveDirectImageUrl } from '../utils/formatters';

interface EditSMTModalProps {
  isOpen: boolean;
  onClose: () => void;
  smt: SMTPerformance | null;
  onSave: (updatedSMT: SMTPerformance) => void;
  isNew?: boolean;
}

export const EditSMTModal: React.FC<EditSMTModalProps> = ({
  isOpen,
  onClose,
  smt,
  onSave,
  isNew = false,
}) => {
  const [formData, setFormData] = useState<SMTPerformance>({
    id: `smt-${Date.now()}`,
    name: '',
    nik: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    targetFurniture: 150000000,
    actualFurniture: 120000000,
    targetAccessories: 60000000,
    actualAccessories: 50000000,
    comser: 10000000,
    polis: 15,
    notes: '',
    phone: '',
  });

  useEffect(() => {
    if (smt) {
      setFormData({ ...smt });
    } else if (isNew) {
      setFormData({
        id: `smt-${Date.now()}`,
        name: '',
        nik: `INF-2026-${Math.floor(100 + Math.random() * 900)}`,
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        targetFurniture: 150000000,
        actualFurniture: 0,
        targetAccessories: 60000000,
        actualAccessories: 0,
        comser: 0,
        polis: 0,
        notes: '',
        phone: '',
      });
    }
  }, [smt, isNew, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      targetFurniture: Math.round(Number(formData.targetFurniture) || 0),
      actualFurniture: Math.round(Number(formData.actualFurniture) || 0),
      targetAccessories: Math.round(Number(formData.targetAccessories) || 0),
      actualAccessories: Math.round(Number(formData.actualAccessories) || 0),
      comser: Math.round(Number(formData.comser) || 0),
      polis: Math.round(Number(formData.polis) || 0),
    });
    onClose();
  };

  const isFurnAchieved = formData.targetFurniture > 0 && formData.actualFurniture >= formData.targetFurniture;
  const isAccAchieved = formData.targetAccessories > 0 && formData.actualAccessories >= formData.targetAccessories;
  const isDualAchieved = isFurnAchieved && isAccAchieved;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#151515] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/5 text-[#FFD700] border border-white/10">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isNew ? 'Tambah Sales Marketing Team (SMT) Baru' : `Edit Data SMT: ${formData.name}`}
              </h3>
              <p className="text-[11px] text-white/40">
                Informa Juanda Medan - Kelola Target, Actual, Comser & Polis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3 flex flex-col items-center">
              <img
                src={getGoogleDriveDirectImageUrl(formData.photoUrl, formData.name || 'SMT')}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#FFD700] shadow-md mb-2 bg-black/40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    formData.name || 'SMT'
                  )}&background=f59e0b&color=0f172a&bold=true`;
                }}
              />
              <span className="text-[10px] text-white/50 text-center font-medium">Preview Foto</span>
            </div>

            <div className="sm:col-span-9 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Nama Lengkap SMT *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Rian Syahputra"
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#FFD700]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    NIK / ID Karyawan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="INF-2024-001"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#FFD700]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1 flex items-center justify-between">
                    <span>Link Foto Google Drive / URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                  />
                  <span className="text-[9px] text-white/40 mt-1 block">
                    Bisa pakai link share Google Drive (Akses: &apos;Anyone with the link&apos;)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Target & Actual Furniture */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#FFD700]" />
                Target & Actual Furniture (Rp)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isFurnAchieved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isFurnAchieved ? '✓ Furniture FullFill' : 'Kekurangan Furniture'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Target Furniture (Rp tanpa desimal)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetFurniture}
                  onChange={(e) => setFormData({ ...formData, targetFurniture: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Actual Sales Furniture (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.actualFurniture}
                  onChange={(e) => setFormData({ ...formData, actualFurniture: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
          </div>

          {/* Target & Actual Accessories */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                Target & Actual Accessories (Rp)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isAccAchieved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isAccAchieved ? '✓ Accessories FullFill' : 'Kekurangan Accessories'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Target Accessories (Rp tanpa desimal)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.targetAccessories}
                  onChange={(e) => setFormData({ ...formData, targetAccessories: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Actual Sales Accessories (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.actualAccessories}
                  onChange={(e) => setFormData({ ...formData, actualAccessories: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
          </div>

          {/* Comser & Polis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Comser (Commercial Service dalam Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.comser}
                onChange={(e) => setFormData({ ...formData, comser: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-cyan-400 font-mono text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Polis (Jumlah Polis Perlindungan)
              </label>
              <input
                type="number"
                min="0"
                value={formData.polis}
                onChange={(e) => setFormData({ ...formData, polis: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-[#FFD700] font-mono font-bold text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>
          </div>

          {/* Insentif preview badge */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDualAchieved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/5 text-white/50'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${isDualAchieved ? 'text-[#FFD700]' : 'text-white/30'}`} />
              <span className="font-bold text-xs">
                Status Insentif:
              </span>
            </div>
            <span className="font-bold text-xs">
              {isDualAchieved ? '🎉 Berhak Mendapat Insentif (100% Furniture & 100% Accessories)' : '⚠️ Belum Berhak Mendapat Insentif (Harus 100% Keduanya)'}
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 font-medium text-xs border border-white/10 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-smt-modal"
              className="px-5 py-2 rounded-lg bg-[#FFD700] hover:bg-[#ffe234] text-black font-bold text-xs shadow transition-colors"
            >
              {isNew ? 'Tambah SMT' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
