import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/stores/app.store';
import { ArrowLeft, MapPin, Plus, Star, Trash2, Phone, User, X, Loader2, Edit2 } from 'lucide-react';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/useAddresses';
import { AddressForm } from '@/components/addresses/AddressForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AddressResponse, CreateAddressInput } from '@nuraskin/shared-types';

export const Route = createFileRoute('/_protected/addresses')({
  component: Addresses,
});

function Addresses() {
  const { isAuthenticated, regionCode } = useAppStore();
  const navigate = useNavigate();
  
  const { data: addresses = [], isLoading } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResponse | undefined>(undefined);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleOpenCreate = () => {
    setEditingAddress(undefined);
    setShowForm(true);
  };

  const handleOpenEdit = (addr: AddressResponse) => {
    setEditingAddress(addr);
    setShowForm(true);
  };

  const handleSubmit = async (data: CreateAddressInput) => {
    if (editingAddress) {
      await updateMutation.mutateAsync({ id: editingAddress.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
  };

  const confirmDelete = async () => {
    if (addressToDelete) {
      await deleteMutation.mutateAsync(addressToDelete);
      setAddressToDelete(null);
    }
  };

  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-stone-400 hover:text-stone-700 transition-colors">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <h1 className="text-xl font-normal text-[#4A1525]">Manzillarim</h1>
          </div>
          {addresses.length < 5 && (
            <button
              onClick={handleOpenCreate}
              className="h-9 px-4 rounded-full bg-[#4A1525] text-white text-[12px] font-light hover:bg-[#6B2540] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              Yangi manzil
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#4A1525]" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-[#f8f7f5] rounded-3xl p-12 text-center border border-dashed border-stone-200">
            <MapPin className="w-12 h-12 text-stone-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-[15px] font-light text-stone-400 mb-6">Saqlangan manzillar yo'q</p>
            <button
              onClick={handleOpenCreate}
              className="px-8 py-3 rounded-full bg-[#4A1525] text-white text-[13px] font-normal hover:bg-[#6B2540] transition-all"
            >
              Yangi manzil qo'shish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-[#f8f7f5] rounded-3xl p-6 border-2 transition-all ${
                  addr.isDefault ? 'border-[#4A1525]/10 shadow-sm' : 'border-transparent hover:border-stone-100'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-stone-800">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4A1525] text-[10px] font-normal text-white">
                        <Star className="w-3 h-3 fill-current" />
                        Asosiy
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefaultMutation.mutate(addr.id)}
                        className="h-8 px-3 rounded-lg text-[11px] font-light text-stone-500 hover:text-[#4A1525] hover:bg-white transition-colors"
                      >
                        Asosiy qilish
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#4A1525] hover:bg-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setAddressToDelete(addr.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-stone-600">
                    <User className="w-4 h-4 text-stone-300" strokeWidth={1.5} />
                    <span className="text-[13px] font-normal">{addr.fullName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-600">
                    <Phone className="w-4 h-4 text-stone-300" strokeWidth={1.5} />
                    <span className="text-[13px] font-normal">{addr.phone}</span>
                  </div>
                  <div className="flex items-start gap-3 text-stone-600">
                    <MapPin className="w-4 h-4 text-stone-300 mt-0.5" strokeWidth={1.5} />
                    <div className="text-[13px] leading-relaxed">
                      {addr.regionCode === 'UZB' ? (
                        <p>{addr.uzbStreet}, {addr.uzbCity}, {addr.uzbRegion}</p>
                      ) : (
                        <div>
                          <p>[{addr.korPostalCode}] {addr.korRoadAddress}</p>
                          <p>{addr.korBuilding && `${addr.korBuilding}, `}{addr.korDetail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {addresses.length >= 5 && (
              <p className="text-[11px] text-stone-400 text-center mt-6">
                Maksimal 5 ta manzil saqlash mumkin.
              </p>
            )}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-light text-[#4A1525]">
                {editingAddress ? 'Manzilni tahrirlash' : 'Yangi manzil qo\'shish'}
              </DialogTitle>
            </DialogHeader>
            <AddressForm
              regionCode={regionCode as 'UZB' | 'KOR'}
              initialData={editingAddress}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Manzilni o'chirish</AlertDialogTitle>
              <AlertDialogDescription>
                Haqiqatdan ham ushbu manzilni o'chirmoqchimisiz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-2">
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                O'chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
