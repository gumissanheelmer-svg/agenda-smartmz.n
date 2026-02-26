import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Plus, Users, Phone, DollarSign, Edit2, Trash2, UserPlus, Copy, KeyRound, Eye, EyeOff, RefreshCw, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Affiliate {
  id: string;
  name: string;
  email?: string | null;
  phone: string | null;
  commission_fixed: number;
  commission_percentage?: number;
  referral_code?: string | null;
  user_id?: string | null;
  total_earnings?: number;
  active: boolean;
  status?: string;
  created_at: string;
  salesCount?: number;
  totalCommission?: number;
}

interface AffiliatesTabProps {
  affiliates: Affiliate[];
  onCreateAffiliate: (data: any) => Promise<void>;
  onUpdateAffiliate: (id: string, data: any) => Promise<void>;
  onDeleteAffiliate: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateReferralCode(name: string): string {
  const slug = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const rand = Math.random().toString(36).substring(2, 6);
  return `${slug}-${rand}`;
}

export function AffiliatesTab({ affiliates, onCreateAffiliate, onUpdateAffiliate, onDeleteAffiliate, onRefresh }: AffiliatesTabProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    commission_fixed: 0,
    commission_percentage: 30,
    referral_code: '',
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', commission_fixed: 0, commission_percentage: 30, referral_code: '' });
    setShowPassword(false);
  };

  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setFormData(prev => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const handleNameChange = (name: string) => {
    const newData: any = { ...formData, name };
    if (!formData.referral_code || formData.referral_code === generateReferralCode(formData.name)) {
      newData.referral_code = generateReferralCode(name);
    }
    setFormData(newData);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: 'Erro', description: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }

    const password = formData.password.trim() || generatePassword();
    const referral_code = formData.referral_code.trim() || generateReferralCode(formData.name);

    if (formData.commission_fixed === 0 && formData.commission_percentage === 0) {
      toast({ title: 'Atenção', description: 'Comissão fixa e percentual estão ambos em 0.' });
    }

    setIsLoading(true);
    try {
      // Call edge function to create auth user + affiliate
      const { data, error } = await supabase.functions.invoke('create-affiliate', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password,
          phone: formData.phone.trim() || undefined,
          commission_fixed: formData.commission_fixed,
          commission_percentage: formData.commission_percentage,
          referral_code,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreatedCredentials({ email: formData.email.trim(), password });
      toast({ title: 'Sucesso', description: 'Afiliado criado com conta de login' });
      setIsCreating(false);
      resetForm();
      onRefresh?.();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Não foi possível criar o afiliado', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setIsLoading(true);
    try {
      await onUpdateAffiliate(id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        commission_fixed: formData.commission_fixed,
        commission_percentage: formData.commission_percentage,
        referral_code: formData.referral_code.trim() || undefined,
      });
      toast({ title: 'Sucesso', description: 'Afiliado atualizado' });
      setIsEditing(null);
      resetForm();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (affiliate: Affiliate) => {
    try {
      const newActive = !affiliate.active;
      await onUpdateAffiliate(affiliate.id, { 
        active: newActive, 
        status: newActive ? 'active' : 'inactive' 
      });
      toast({ title: 'Sucesso', description: `Afiliado ${newActive ? 'ativado' : 'desativado'}` });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar status', variant: 'destructive' });
    }
  };

  const handleResetPassword = async (affiliate: Affiliate) => {
    if (!affiliate.user_id) {
      toast({ title: 'Erro', description: 'Este afiliado não tem conta vinculada', variant: 'destructive' });
      return;
    }
    const newPassword = generatePassword();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-affiliate-password', {
        body: { affiliate_id: affiliate.id, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResetCredentials({ name: affiliate.name, email: affiliate.email || '', password: newPassword });
      toast({ title: 'Sucesso', description: 'Senha resetada' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Não foi possível resetar a senha', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    try {
      await onDeleteAffiliate(id);
      toast({ title: 'Sucesso', description: 'Afiliado excluído' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir', variant: 'destructive' });
    }
  };

  const openEditDialog = (affiliate: Affiliate) => {
    setFormData({
      name: affiliate.name,
      email: affiliate.email || '',
      password: '',
      phone: affiliate.phone || '',
      commission_fixed: affiliate.commission_fixed,
      commission_percentage: affiliate.commission_percentage || 30,
      referral_code: affiliate.referral_code || '',
    });
    setIsEditing(affiliate.id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência' });
  };

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const activeAffiliates = affiliates.filter(a => a.active).length;
  const totalCommissions = affiliates.reduce((sum, a) => sum + (a.totalCommission || 0), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <Card className="border-border/50 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/80 pointer-events-none" />
            <CardContent className="relative z-10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total de Afiliados</p>
                  <p className="text-2xl font-bold">{affiliates.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-border/50 bg-gradient-to-br from-green-500/20 to-green-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/80 pointer-events-none" />
            <CardContent className="relative z-10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ativos</p>
                  <p className="text-2xl font-bold">{activeAffiliates}</p>
                </div>
                <Users className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-border/50 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/80 pointer-events-none" />
            <CardContent className="relative z-10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Comissões</p>
                  <p className="text-2xl font-bold">{totalCommissions.toLocaleString('pt-BR')} MT</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Affiliates Table */}
      <motion.div variants={item}>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-20">
            <div>
              <CardTitle className="text-lg font-medium">Afiliados</CardTitle>
              <CardDescription>Gerencie afiliados com login e comissões</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setIsCreating(true); }} type="button">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Afiliado
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Fixa</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum afiliado cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  affiliates.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell className="font-medium">{aff.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{aff.email || '—'}</TableCell>
                      <TableCell>
                        {aff.referral_code ? (
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{aff.referral_code}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyReferralLink(aff.referral_code!)}>
                              <Link2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{aff.commission_fixed.toLocaleString('pt-BR')} MT</TableCell>
                      <TableCell className="text-right">{aff.commission_percentage || 30}%</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch checked={aff.active} onCheckedChange={() => handleToggleActive(aff)} />
                          <Badge variant={aff.active ? "default" : "secondary"}>{aff.active ? 'Ativo' : 'Inativo'}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(aff)} title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {aff.user_id && (
                            <Button variant="ghost" size="icon" onClick={() => handleResetPassword(aff)} title="Resetar senha" disabled={isLoading}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(aff.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Afiliado</DialogTitle>
            <DialogDescription>Crie um afiliado com conta de login para acessar o painel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Nome do afiliado" />
            </div>
            <div className="space-y-2">
              <Label>Email * <span className="text-xs text-muted-foreground ml-1">(usado para login no painel)</span></Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="afiliado@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mín. 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={handleGeneratePassword} title="Gerar senha aleatória">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Deixe vazio para gerar automaticamente.</p>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+258 84 000 0000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comissão Fixa (MT)</Label>
                <Input type="number" min="0" step="100" value={formData.commission_fixed} onChange={(e) => setFormData({ ...formData, commission_fixed: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input type="number" min="0" max="100" value={formData.commission_percentage} onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código de Indicação</Label>
              <Input
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="auto-gerado"
              />
              <p className="text-xs text-muted-foreground">Apenas letras, números e hífens. Auto-gerado a partir do nome.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar Afiliado'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comissão Fixa (MT)</Label>
                <Input type="number" min="0" step="100" value={formData.commission_fixed} onChange={(e) => setFormData({ ...formData, commission_fixed: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input type="number" min="0" max="100" value={formData.commission_percentage} onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código de Indicação</Label>
              <Input
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(null)}>Cancelar</Button>
            <Button onClick={() => isEditing && handleUpdate(isEditing)} disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog (after create) */}
      <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Afiliado Criado com Sucesso</DialogTitle>
            <DialogDescription>Copie as credenciais abaixo. A senha só será exibida uma vez.</DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-4 py-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-mono text-sm">{createdCredentials.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Senha</p>
                      <p className="font-mono text-sm">{createdCredentials.password}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const text = `Credenciais do Afiliado:\nEmail: ${createdCredentials.email}\nSenha: ${createdCredentials.password}\nAcesse: ${window.location.origin}/login`;
                  copyToClipboard(text);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar tudo
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedCredentials(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetCredentials} onOpenChange={() => setResetCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha Resetada</DialogTitle>
            <DialogDescription>Nova senha de {resetCredentials?.name}. Copie agora — não será exibida novamente.</DialogDescription>
          </DialogHeader>
          {resetCredentials && (
            <div className="space-y-4 py-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-mono text-sm">{resetCredentials.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(resetCredentials.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Nova Senha</p>
                      <p className="font-mono text-sm">{resetCredentials.password}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(resetCredentials.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResetCredentials(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
