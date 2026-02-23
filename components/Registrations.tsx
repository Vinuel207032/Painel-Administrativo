
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, X, UserCircle, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, Save, Image as ImageIcon, 
  Check, Edit3, Users, KeyRound, Bell, Filter, ChevronRight, Building2, Layers, AlertCircle, Printer, ChevronLeft,
  ShieldCheck, Briefcase, Store, ArrowRight, Calendar, Phone, User as UserIcon, ChevronDown, Trash2, Ban, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';
import { Breadcrumb } from './Breadcrumb';
import { useConfig } from '../contexts/ConfigContext';

interface RegistrationsProps {
  activeSubTab: string;
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string, dados_antigos?: string, dados_novos?: string, entidade_id?: number, entidade_tipo?: string) => void;
}

// Utilitários de Formatação e Validação
const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/^(\d{2})(\d)/g, "($1) $2")
          .replace(/(\d)(\d{4})$/, "$1-$2");
};

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  return true;
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length < 6) return `rgba(30, 41, 59, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getContrastColor = (hex: string) => {
  if (!hex || hex.length < 6) return 'white';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1e293b' : 'white';
};

export const Registrations: React.FC<RegistrationsProps> = ({ 
  activeSubTab, theme, user, onAuditLog 
}) => {
  const { config } = useConfig();
  const [listData, setListData] = useState<any[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT_USER' | 'CREATE_WIZARD'>('LIST');
  const [createStep, setCreateStep] = useState<'SELECT_TYPE' | 'FILL_FORM'>('SELECT_TYPE');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  // Ref para o popup de filtro
  const filterPopupRef = useRef<HTMLDivElement>(null);
  // Ref para o dropdown de empresa
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Click Outside para fechar o filtro
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setIsFilterPopupOpen(false);
      }
    }
    if (isFilterPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterPopupOpen]);

  // Click Outside para fechar o dropdown de empresa
  useEffect(() => {
    function handleClickOutsideCompany(event: MouseEvent) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    }
    if (isCompanyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutsideCompany);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideCompany);
    };
  }, [isCompanyDropdownOpen]);

  // Filtros Ativos
  const [activeFilters, setActiveFilters] = useState<{
    types: string[],
    status: string[],
    companies: (string|number)[]
  }>({
    types: [],
    status: [],
    companies: []
  });

  const [editNewPassword, setEditNewPassword] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [filterCompanySearchTerm, setFilterCompanySearchTerm] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [cpfConfirmInput, setCpfConfirmInput] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [masterAuthPassword, setMasterAuthPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarsList, setAvatarsList] = useState<any[]>([]);

  const primaryColor = config['sistema.cor_primaria'] || 'var(--primary-color, #1e293b)';
  const contrastText = getContrastColor(primaryColor);
  const navbarLogo = config['sistema.logo_navbar'] || "https://i.ibb.co/S7tsNgbC/logo.png";

  const [userForm, setUserForm] = useState({
    id: null, nome: '', cpf: '', email: '', password: '', tipo_usuario: 'LOGISTA', status: 'ATIVO', 
    foto_perfil_url: '', telefone: '', data_nascimento: '', genero: 'NAO_INFORMADO', empresa_id: '',
    avatar_id: 1
  });

  useEffect(() => {
    fetchData();
    fetchCompanies();
    fetchAvatars();
    setViewMode('LIST');
    setCurrentPage(1);
  }, [activeSubTab]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAvatars = async () => {
    try {
      const { data } = await supabase!
        .from('avatars')
        .select('id, url_imagem')
        .eq('ativo', true)
        .order('ordem');
      setAvatarsList(data || []);
    } catch (e) {}
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await supabase!.from('empresas').select('id, nome, logo_url').order('nome');
      setCompaniesList(data || []);
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    let table = 'usuarios';
    let query = supabase!.from(table).select('*, avatars:avatar_id(url_imagem)');

    if (activeSubTab === 'REG_AVATARS') {
      table = 'avatars';
      query = supabase!.from(table).select('*');
    } else if (activeSubTab === 'REG_COMPANIES') {
      table = 'empresas';
      query = supabase!.from(table).select('*');
    } else if (activeSubTab === 'REG_CATEGORIES') {
      table = 'categorias';
      query = supabase!.from(table).select('*');
    } else if (activeSubTab === 'REG_BANNERS') {
      table = 'banners';
      query = supabase!.from(table).select('*');
    }

    try {
      if (table === 'usuarios') {
        query = query.neq('status', 'DELETADO');
      }
      const { data, error } = await query.order('id', { ascending: false });
      if (!error) setListData(data || []);
    } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return listData.filter(i => {
      if (activeSubTab === 'REG_USERS' && i.tipo_usuario === 'CLIENTE') return false;
      
      // Filtro de Texto
      const searchStr = `${i.nome} ${i.email} ${i.cpf} ${i.tipo_usuario}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      
      // Filtros de Categoria (Multi-seleção)
      const matchesType = activeFilters.types.length === 0 || activeFilters.types.includes(i.tipo_usuario);
      const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(i.status);
      const matchesCompany = activeFilters.companies.length === 0 || activeFilters.companies.includes(String(i.empresa_id));

      return matchesSearch && matchesType && matchesStatus && matchesCompany;
    });
  }, [listData, searchTerm, activeSubTab, activeFilters]);

  const filterCount = activeFilters.types.length + activeFilters.status.length + activeFilters.companies.length;

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const handleEditUser = async (u: any) => {
    if (u.status !== 'ATIVO') {
      if (window.confirm(`Este operador está ${u.status.toLowerCase()}. Deseja reativá-lo para 'ATIVO' antes de editar?`)) {
        try {
          setLoading(true);
          const { error } = await supabase!.from('usuarios').update({ status: 'ATIVO' }).eq('id', u.id);
          if (error) throw error;
          showToast('Operador reativado com sucesso!', 'success');
          onAuditLog('UPDATE', 'USUARIOS', `Reativou o operador ${u.nome}`, JSON.stringify(u), JSON.stringify({ ...u, status: 'ATIVO' }), u.id, 'USUARIO');
          fetchData(); // Refresh the list to show the updated status
          // Proceed to open the modal with the now active user data
          u.status = 'ATIVO'; 
        } catch (err: any) {
          showToast(`Erro ao reativar: ${err.message}`, 'error');
          setLoading(false);
          return; // Stop if reactivation fails
        } finally {
          setLoading(false);
        }
      }
    }

    setUserForm({
      id: u.id,
      nome: toTitleCase(u.nome || ""),
      email: u.email || "",
      cpf: u.cpf || "", 
      password: '',
      tipo_usuario: u.tipo_usuario || 'LOGISTA',
      status: u.status || 'ATIVO',
      foto_perfil_url: u.avatars?.url_imagem || u.foto_url || u.url_imagem || "",
      telefone: u.telefone || "",
      data_nascimento: u.data_nascimento || "",
      genero: u.genero || 'NAO_INFORMADO',
      empresa_id: u.empresa_id || '',
      avatar_id: u.avatar_id || 1
    });
    setEditNewPassword('');
    setCpfConfirmInput('');
    setIsPasswordUnlocked(false);
    setViewMode('EDIT_USER');
  };

  const handleDeleteClick = (u: any) => {
    console.log("--- DEBUG: Botão Excluir Clicado ---", u);
    const currentUserRole = (user?.perfil || user?.tipo_usuario || '').toUpperCase();
    setUserToDelete(u);
    if (currentUserRole === 'MASTER') {
      if (confirm(`Deseja realmente excluir o operador ${u.nome}? Esta ação é irreversível.`)) {
        executeDeletion(u, 'Exclusão direta por MASTER', '');
      }
    } else if (currentUserRole === 'ADMINISTRATIVO' || currentUserRole === 'ADMIN') {
      setIsDeleteModalOpen(true);
    } else {
      showToast("Você não tem permissão para excluir usuários.", "error");
    }
  };

  const executeDeletion = async (u: any, acao: string, justificativa: string) => {
    if (!u || !u.id) {
      showToast("Erro: Operador não identificado.", "error");
      return;
    }

    setLoading(true);
    try {
      const { data: oldData } = await supabase!.from('usuarios').select('*').eq('id', u.id).single();
      const dadosAntigosStr = oldData ? JSON.stringify(oldData) : undefined;
      
      const updatePayload = { status: 'DELETADO' };
      const dadosNovosStr = oldData ? JSON.stringify({ ...oldData, ...updatePayload }) : undefined;

      const { error } = await supabase!.from('usuarios').update(updatePayload).eq('id', u.id);
      if (error) throw error;

      await onAuditLog(
        'DELETE', 
        'USUARIOS', 
        `${acao}. Motivo: ${justificativa || 'N/A'}. Operador: ${u.nome} (ID: ${u.id})`,
        dadosAntigosStr,
        dadosNovosStr,
        u.id,
        'USUARIO'
      );

      showToast("Operador excluído com sucesso!", "success");
      
      setIsDeleteModalOpen(false);
      setDeleteJustification('');
      setMasterAuthPassword('');
      setUserToDelete(null);
      setViewMode('LIST');
      fetchData();
    } catch (err: any) {
      console.error("Erro na exclusão:", err);
      showToast("Erro ao excluir: " + (err.message || "Erro desconhecido"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeDeletion = async () => {
    if (!deleteJustification.trim()) {
      showToast("A justificativa é obrigatória!", "error");
      return;
    }
    if (!masterAuthPassword) {
      showToast("A senha do MASTER é obrigatória!", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Buscar todos os usuários MASTER para validar a senha
      const { data: masters, error: masterError } = await supabase!
        .from('usuarios')
        .select('senha_hash, nome')
        .eq('tipo_usuario', 'MASTER');

      if (masterError) throw new Error("Erro ao buscar autorizadores MASTER: " + masterError.message);
      if (!masters || masters.length === 0) throw new Error("Nenhum usuário MASTER encontrado para autorização.");

      // 2. Gerar hash da senha digitada
      const inputHash = await generateHash(masterAuthPassword);
      
      // 3. Verificar se a senha corresponde a algum MASTER (Comparação case-sensitive para segurança de hash)
      const authorizedMaster = masters.find(m => m.senha_hash === inputHash);

      if (!authorizedMaster) {
        throw new Error("Senha MASTER inválida. Autorização negada.");
      }

      // 4. Prosseguir com a exclusão
      await executeDeletion(userToDelete, `Exclusão autorizada por MASTER (${authorizedMaster.nome})`, deleteJustification);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintUser = (u: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentUserName = user?.nome || 'Operador do Sistema';
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório Individual - ${u.nome}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; margin: 0; position: relative; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; position: relative; z-index: 10; }
            .logo { height: 50px; margin-bottom: 15px; filter: grayscale(1) brightness(0); }
            h1 { text-transform: uppercase; font-size: 22px; font-weight: 900; color: #0f172a; margin: 10px 0; }
            .content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; position: relative; z-index: 10; }
            .section { background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .data-item { margin-bottom: 10px; }
            .label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; display: block; }
            .value { font-size: 12px; font-weight: 700; color: #1e293b; }
            .footer { position: fixed; bottom: 40px; left: 40px; right: 40px; border-top: 2px solid #f1f5f9; padding-top: 20px; text-align: center; z-index: 10; }
            .legal-term { font-size: 9px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; line-height: 1.5; }

            /* MARCA D'ÁGUA */
            .watermark-container {
              position: fixed;
              top: 0; left: 0; width: 100%; height: 100%;
              z-index: -1;
              pointer-events: none;
              display: flex;
              flex-direction: column;
              justify-content: space-around;
              align-items: center;
              overflow: hidden;
            }
            .watermark-text {
              font-size: 40px;
              color: rgba(0, 0, 0, 0.015);
              font-weight: 900;
              text-transform: uppercase;
              transform: rotate(-45deg);
              white-space: nowrap;
              user-select: none;
            }
          </style>
        </head>
        <body>
          <div class="watermark-container">
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
          </div>

          <div class="header">
            <img src="${navbarLogo}" class="logo" />
            <h1>Ficha Cadastral do Operador</h1>
            <p style="font-size: 10px; color: #64748b; font-weight: bold;">Documento gerado em ${formattedDate} às ${formattedTime} por ${currentUserName}</p>
          </div>
          <div class="content">
            <div class="section">
              <div class="section-title">Dados Pessoais</div>
              <div class="data-item"><span class="label">Nome Completo</span><span class="value">${u.nome}</span></div>
              <div class="data-item"><span class="label">CPF</span><span class="value">${u.cpf}</span></div>
              <div class="data-item"><span class="label">E-mail</span><span class="value">${u.email}</span></div>
              <div class="data-item"><span class="label">Telefone</span><span class="value">${u.telefone || '-'}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Informações de Acesso</div>
              <div class="data-item"><span class="label">Nível de Acesso</span><span class="value">${u.tipo_usuario}</span></div>
              <div class="data-item"><span class="label">Status</span><span class="value">${u.status}</span></div>
              <div class="data-item"><span class="label">Data de Nascimento</span><span class="value">${u.data_nascimento || '-'}</span></div>
              <div class="data-item"><span class="label">Gênero</span><span class="value">${u.genero || '-'}</span></div>
            </div>
          </div>
          ${u.tipo_usuario === 'LOGISTA' ? `
            <div class="section" style="margin-bottom: 40px; position: relative; z-index: 10;">
              <div class="section-title">Vínculo Empresarial</div>
              <div class="data-item"><span class="label">Empresa Parceira</span><span class="value">${selectedCompany?.nome || 'Não vinculada'}</span></div>
            </div>
          ` : ''}
          <div class="footer">
            <p class="legal-term">Termo de Responsabilidade: É de total responsabilidade do emissor o não compartilhamento dos dados sensíveis do usuário.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const saveAvatarSelection = async () => {
    if (userForm.id) {
      setLoading(true);
      try {
        const { data: oldData } = await supabase!.from('usuarios').select('*').eq('id', userForm.id).single();
        const dadosAntigosStr = oldData ? JSON.stringify(oldData) : undefined;
        const dadosNovosStr = oldData ? JSON.stringify({ ...oldData, avatar_id: userForm.avatar_id }) : undefined;

        const { error } = await supabase!.from('usuarios').update({ avatar_id: userForm.avatar_id }).eq('id', userForm.id);
        if (error) throw error;
        showToast("Avatar atualizado com sucesso!", "success");
        onAuditLog(
          'UPDATE', 
          'USUARIOS', 
          `Alterou avatar do operador ${userForm.nome}`,
          dadosAntigosStr,
          dadosNovosStr,
          userForm.id,
          'USUARIO'
        );
        fetchData();
      } catch (err: any) {
        showToast("Erro ao atualizar avatar: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    }
    setIsAvatarModalOpen(false);
  };

  const [cpfError, setCpfError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  const handleOpenCreateWizard = () => {
    setUserForm({
      id: null, nome: '', cpf: '', email: '', password: '', tipo_usuario: 'LOGISTA', status: 'ATIVO', 
      foto_perfil_url: '', telefone: '', data_nascimento: '', genero: 'NAO_INFORMADO', empresa_id: ''
    });
    setCreateStep('SELECT_TYPE');
    setViewMode('CREATE_WIZARD');
    setCpfError(null);
    setPasswordError(null);
    setDobError(null);
  };

  const validateCpfCheck = () => {
    const cleanInput = cpfConfirmInput.replace(/\D/g, "");
    const cleanStored = userForm.cpf.replace(/\D/g, "");
    if (cleanInput === cleanStored && cleanInput.length > 0) {
      setIsPasswordUnlocked(true);
      showToast("Verificado! Campo de senha liberado.", "success");
    } else {
      showToast("O CPF digitado não confere.", "error");
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserForm({...userForm, cpf: val});
    if (val.replace(/\D/g, "").length === 11) {
      if (validateCPF(val)) {
        setCpfError("CPF Ok");
      } else {
        setCpfError("CPF é inválido, tente um CPF correto");
      }
    } else {
      setCpfError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserForm({...userForm, password: val});
    if (val.length > 0 && val.length < 6) {
      setPasswordError("Essa senha precisa ter no mínimo seis caracteres");
    } else {
      setPasswordError(null);
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserForm({...userForm, data_nascimento: val});
    if (val) {
      const date = new Date(val);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      if (date > oneYearAgo) {
        setDobError("Data inválida (idade mínima de 1 ano)");
      } else {
        setDobError(null);
      }
    } else {
      setDobError(null);
    }
  };

  const handleSave = async () => {
    // Validação de Campos Obrigatórios
    if (!userForm.nome || !userForm.email || !userForm.cpf || !userForm.telefone || !userForm.data_nascimento || !userForm.genero) {
      showToast("Todos os campos são obrigatórios!", "error");
      return;
    }

    if (!validateCPF(userForm.cpf)) {
      showToast("CPF Inválido!", "error");
      setCpfError("CPF é inválido, tente um CPF correto");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      showToast("E-mail com formato incorreto!", "error");
      return;
    }

    if (userForm.tipo_usuario === 'LOGISTA' && !userForm.empresa_id) {
      showToast("Selecione uma empresa para o Logista!", "error");
      return;
    }

    const isEditing = userForm.id !== null;
    if (!isEditing && userForm.password.length < 6) {
        showToast("A senha deve ter no mínimo 6 caracteres.", "error");
        setPasswordError("Essa senha precisa ter no mínimo seis caracteres");
        return;
    }
    
    if (dobError) {
        showToast("Data de nascimento inválida.", "error");
        return;
    }

    setLoading(true);
    let table = activeSubTab === 'REG_AVATARS' ? 'avatars' : 'usuarios';

    // Mapeamento de Gênero para ENUM do Banco
    let mappedGender = 'NAO_INFORMADO';
    if (userForm.genero === 'MASCULINO') mappedGender = 'M';
    else if (userForm.genero === 'FEMININO') mappedGender = 'F';
    else if (userForm.genero === 'NAO_INFORMADO' || userForm.genero === 'OUTRO') mappedGender = 'NAO_INFORMADO';

    // Mapeamento de Tipo de Usuário para ENUM do Banco
    let mappedUserType = userForm.tipo_usuario;
    if (userForm.tipo_usuario === 'ADMIN') mappedUserType = 'ADMINISTRATIVO';

    const payload: any = {
      nome: userForm.nome,
      email: userForm.email,
      tipo_usuario: mappedUserType,
      status: 'ATIVO',
      cpf: userForm.cpf.replace(/\D/g, ""), 
      telefone: userForm.telefone,
      data_nascimento: userForm.data_nascimento,
      genero: mappedGender,
      empresa_id: userForm.empresa_id || null
    };
    
    // Ajuste para garantir CPF limpo se o banco tiver limite de 11 chars, ou formatado se for varchar(14). 
    // O schema diz character varying(14), então cabe formatado. O código original enviava formatado.
    // Vou manter formatado pois o formatCPF é aplicado no value do input.
    payload.cpf = userForm.cpf; 

    if (!isEditing) {
      payload.avatar_id = userForm.avatar_id || 1;
      payload.email_verificado = false;
    } else {
      payload.avatar_id = userForm.avatar_id;
    }

    if (activeSubTab === 'REG_AVATARS') {
      payload.titulo = userForm.nome;
      payload.url_imagem = userForm.foto_perfil_url;
    }

    if ((!isEditing && userForm.password) || (isPasswordUnlocked && editNewPassword)) {
      const passwordToHash = isEditing ? editNewPassword : userForm.password;
      if (passwordToHash.length >= 6) {
        payload.senha_hash = await generateHash(passwordToHash);
      }
    }

    try {
      let result;
      let dadosAntigosStr: string | undefined;
      let dadosNovosStr: string | undefined;

      if (isEditing) {
        const { data: oldData } = await supabase!.from(table).select('*').eq('id', userForm.id).single();
        dadosAntigosStr = oldData ? JSON.stringify(oldData) : undefined;
        dadosNovosStr = oldData ? JSON.stringify({ ...oldData, ...payload }) : JSON.stringify(payload);
        
        result = await supabase!.from(table).update(payload).eq('id', userForm.id);
      } else {
        dadosNovosStr = JSON.stringify(payload);
        result = await supabase!.from(table).insert([payload]);
      }

      if (!result.error) {
        showToast(isEditing ? "Dados atualizados!" : "Operador criado com sucesso!", "success");
        setViewMode('LIST');
        fetchData();
        onAuditLog(
          isEditing ? 'UPDATE' : 'INSERT', 
          table, 
          `${isEditing ? 'Editou' : 'Criou'} registro ${userForm.nome}`,
          dadosAntigosStr,
          dadosNovosStr,
          userForm.id,
          table === 'usuarios' ? 'USUARIO' : 'AVATAR'
        );
      } else {
        console.error(result.error);
        showToast(result.error.message.includes('unique') ? "CPF ou E-mail já cadastrado." : `Erro ao salvar: ${result.error.message}`, "error");
      }
    } finally { setLoading(false); }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentUserName = user?.nome || 'Operador do Sistema';
    const currentUserType = (user?.perfil || user?.tipo_usuario || 'USUÁRIO').toUpperCase();
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    // Cálculos Estatísticos
    const total = filtered.length;
    
    const countByType = filtered.reduce((acc: any, curr) => {
      const t = curr.tipo_usuario || 'OUTROS';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const countByStatus = filtered.reduce((acc: any, curr) => {
      const s = curr.status || 'OUTROS';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const countByGender = filtered.reduce((acc: any, curr) => {
      let g = 'Não Informado';
      if (curr.genero === 'M') g = 'Masculino';
      else if (curr.genero === 'F') g = 'Feminino';
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});

    // Helper para gerar gradiente cônico (Pie Chart)
    const generateConicGradient = (data: any, colors: string[]) => {
      let gradient = [];
      let start = 0;
      const entries = Object.entries(data);
      const totalVal = entries.reduce((sum: number, [_, val]: any) => sum + val, 0);
      
      entries.forEach(([key, val]: any, index) => {
        const percentage = (val / totalVal) * 100;
        const end = start + percentage;
        const color = colors[index % colors.length];
        gradient.push(`${color} ${start}% ${end}%`);
        start = end;
      });
      
      return `conic-gradient(${gradient.join(', ')})`;
    };

    // Cores em tons de cinza para impressão
    const typeColors = ['#111111', '#666666', '#999999', '#cccccc'];
    const statusColors = ['#000000', '#444444', '#888888', '#bbbbbb'];
    const genderColors = ['#333333', '#777777', '#aaaaaa'];

    const rows = filtered.map(u => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11px; text-transform: uppercase;">${u.nome || u.razao_social || u.titulo}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px;">${u.tipo_usuario || 'OPERADOR'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px; font-weight: 800; color: #000;">${u.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Operadores - Clube da Gente</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .dashboard { display: grid !important; }
              .pie { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; margin: 0; position: relative; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; position: relative; z-index: 10; }
            .logo { height: 60px; margin-bottom: 15px; filter: grayscale(1) brightness(0); }
            .operator-info { font-size: 11px; font-weight: bold; color: #64748b; margin-top: 5px; }
            h1 { text-transform: uppercase; font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #000; margin: 10px 0; }
            
            /* DASHBOARD */
            .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; position: relative; z-index: 10; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 20px; display: flex; flex-direction: column; align-items: center; min-height: 100px; justify-content: center; }
            .card-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 12px; letter-spacing: 1px; width: 100%; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            .big-number { font-size: 36px; font-weight: 900; color: #0f172a; line-height: 1; }
            .chart-container { display: flex; align-items: center; gap: 20px; width: 100%; justify-content: space-between; }
            .pie { width: 60px; height: 60px; border-radius: 50%; flex-shrink: 0; border: 1px solid #e2e8f0; }
            .legend { font-size: 9px; display: flex; flex-direction: column; gap: 5px; flex-grow: 1; }
            .legend-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px; }
            .legend-item:last-child { border-bottom: none; }
            .dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; margin-right: 6px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; position: relative; z-index: 10; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #000; border-bottom: 2px solid #000; }
            .footer { font-size: 9px; margin-top: 60px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }

            /* MARCA D'ÁGUA */
            .watermark-container {
              position: fixed;
              top: 0; left: 0; width: 100%; height: 100%;
              z-index: -1;
              pointer-events: none;
              display: flex;
              flex-direction: column;
              justify-content: space-around;
              align-items: center;
              overflow: hidden;
            }
            .watermark-text {
              font-size: 40px;
              color: rgba(0, 0, 0, 0.015);
              font-weight: 900;
              text-transform: uppercase;
              transform: rotate(-45deg);
              white-space: nowrap;
              user-select: none;
            }
          </style>
        </head>
        <body>
          <div class="watermark-container">
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
          </div>

          <div class="header">
            <img src="${navbarLogo}" class="logo" />
            <h1>Lista de Operadores Ativos</h1>
            <div class="operator-info">Gerado em: ${formattedDate} às ${formattedTime}<br/>Emissor: ${currentUserName}</div>
          </div>

          <div class="dashboard">
            <div class="card">
              <div class="card-title">Total de Registros</div>
              <div class="big-number">${total}</div>
            </div>

            <div class="card">
              <div class="card-title">Perfil de Acesso</div>
              <div class="chart-container">
                <div class="pie" style="background: ${generateConicGradient(countByType, typeColors)}"></div>
                <div class="legend">
                  ${Object.entries(countByType).map(([k, v]: any, i) => `
                    <div class="legend-item">
                      <span><span class="dot" style="background: ${typeColors[i % typeColors.length]}"></span>${k}</span>
                      <strong>${v}</strong>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Status Operacional</div>
              <div class="chart-container">
                <div class="pie" style="background: ${generateConicGradient(countByStatus, statusColors)}"></div>
                <div class="legend">
                  ${Object.entries(countByStatus).map(([k, v]: any, i) => `
                    <div class="legend-item">
                      <span><span class="dot" style="background: ${statusColors[i % statusColors.length]}"></span>${k}</span>
                      <strong>${v}</strong>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Divisão por Gênero</div>
              <div class="chart-container">
                <div class="pie" style="background: ${generateConicGradient(countByGender, genderColors)}"></div>
                <div class="legend">
                  ${Object.entries(countByGender).map(([k, v]: any, i) => `
                    <div class="legend-item">
                      <span><span class="dot" style="background: ${genderColors[i % genderColors.length]}"></span>${k}</span>
                      <strong>${v}</strong>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <table>
            <thead><tr><th>Nome / Registro do Operador</th><th>Nível de Acesso</th><th>Status Operacional</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getUserBadgeStyle = (tipo: string) => {
    const type = (tipo || '').toUpperCase();
    if (type === 'MASTER') return { background: 'linear-gradient(to right, #f59e0b, #fbbf24)', color: 'white' };
    if (type === 'ADMIN' || type === 'ADMINISTRATIVO') return { background: `linear-gradient(to right, #fbbf24, ${primaryColor})`, color: 'white' };
    return { background: primaryColor, color: contrastText };
  };

  const isFormLocked = userForm.tipo_usuario === 'LOGISTA' && !userForm.empresa_id;
  const selectedCompany = companiesList.find(c => String(c.id) === String(userForm.empresa_id));

  // Função para gerenciar filtros multi-seleção
  const toggleFilter = (category: 'types' | 'status' | 'companies', value: any) => {
    setActiveFilters(prev => {
      const current = [...prev[category]];
      const index = current.indexOf(String(value));
      if (index > -1) current.splice(index, 1);
      else current.push(String(value));
      return { ...prev, [category]: current };
    });
    setCurrentPage(1);
  };

  const [printerHover, setPrinterHover] = useState(false);

  return (
    <div className="animate-fade-in pb-10">
      <Breadcrumb theme={theme} paths={[{ label: 'Cadastros' }, { label: 'Operadores', active: true }]} />

      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <Bell size={20} /> <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-row justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <div style={{ backgroundColor: primaryColor }} className="w-16 h-16 text-white rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
             <Users size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Operadores</h2>
            <p className="font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>Gerenciar os operadores que possuem acesso ao painel.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint} 
            onMouseEnter={() => setPrinterHover(true)}
            onMouseLeave={() => setPrinterHover(false)}
            className="w-14 h-14 rounded-2xl border-2 bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center transition-all"
            style={{ borderColor: hexToRgba(primaryColor, 0.1), color: printerHover ? primaryColor : '#cbd5e1' }}
          >
            <Printer size={22} />
          </button>
          <button onClick={handleOpenCreateWizard} style={{ backgroundColor: primaryColor, color: contrastText }} className="w-14 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* TEXTO AUXILIAR - EXPLICAÇÃO DA PÁGINA */}
      <div className="mb-10 p-8 rounded-[2rem] border transition-all flex flex-col md:flex-row items-start md:items-center gap-6" 
           style={{ backgroundColor: hexToRgba(primaryColor, 0.05), borderColor: hexToRgba(primaryColor, 0.1) }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
          <AlertCircle size={28} className="animate-pulse" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-black uppercase text-xs tracking-[0.2em]" style={{ color: primaryColor }}>Gestão Centralizada de Acessos</h4>
          <p className="text-sm font-bold leading-relaxed opacity-90" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
            Utilize esta tela para gerenciar os operadores que possuem acesso ao painel. Você pode definir permissões MASTER, ADMIN ou LOGISTA e controlar o status de cada conta.
          </p>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTRO AVANÇADO */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou e-mail..." 
            className="w-full pl-16 pr-6 py-5 rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-opacity-100 font-bold shadow-sm transition-all"
            style={{ borderColor: hexToRgba(primaryColor, 0.1) }}
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
            className="p-5 rounded-full border-2 bg-white dark:bg-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative"
            style={{ borderColor: hexToRgba(primaryColor, 0.1), color: filterCount > 0 ? primaryColor : '#cbd5e1' }}
          >
            <Filter size={24} />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                {filterCount}
              </span>
            )}
          </button>

          {/* POPUP DE FILTRO AVANÇADO */}
          {isFilterPopupOpen && (
            <div ref={filterPopupRef} className="absolute top-full right-0 mt-4 z-[50] w-80 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtragem Ativa</h4>
                <button onClick={() => { setActiveFilters({types:[], status:[], companies:[]}); setIsFilterPopupOpen(false); }} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:brightness-90 transition-all">Limpar</button>
              </div>

              <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* CATEGORIA: TIPO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Tipo de Usuário</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'MASTER', value: 'MASTER' },
                      { label: 'ADMIN', value: 'ADMINISTRATIVO' },
                      { label: 'LOGISTA', value: 'LOGISTA' }
                    ].map(t => (
                      <button 
                        key={t.value}
                        onClick={() => toggleFilter('types', t.value)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${activeFilters.types.includes(t.value) ? 'shadow-md scale-105' : 'bg-slate-50 border-transparent text-slate-400 opacity-60'}`}
                        style={activeFilters.types.includes(t.value) ? { backgroundColor: primaryColor, color: contrastText, borderColor: primaryColor } : {}}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CATEGORIA: STATUS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Status da Conta</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {label: 'ATIVO', value: 'ATIVO'}, 
                      {label: 'INATIVO', value: 'INATIVO'}, 
                      {label: 'BLOQUEADO', value: 'SUSPENSO'}, 
                      {label: 'DELETADO', value: 'EXCLUIDO'}
                    ].map(s => (
                      <button 
                        key={s.value}
                        onClick={() => toggleFilter('status', s.value)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${activeFilters.status.includes(s.value) ? 'shadow-md scale-105' : 'bg-slate-50 border-transparent text-slate-400 opacity-60'}`}
                        style={activeFilters.status.includes(s.value) ? { backgroundColor: primaryColor, color: contrastText, borderColor: primaryColor } : {}}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CATEGORIA: EMPRESAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Empresas / Parceiros</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Filtrar empresas..." 
                    className="w-full p-2 mb-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-[10px] font-bold outline-none focus:border-yellow-500"
                    value={filterCompanySearchTerm}
                    onChange={(e) => setFilterCompanySearchTerm(e.target.value)}
                  />
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {companiesList.filter(c => c.nome.toLowerCase().includes(filterCompanySearchTerm.toLowerCase())).map(co => (
                      <button 
                        key={co.id}
                        onClick={() => toggleFilter('companies', co.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all ${activeFilters.companies.includes(String(co.id)) ? 'shadow-md scale-[1.02]' : 'bg-slate-50/50 border-transparent opacity-50'}`}
                        style={activeFilters.companies.includes(String(co.id)) ? { borderColor: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.05) } : {}}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white bg-white shadow-inner flex-shrink-0">
                          <img src={co.logo_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-[9px] uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate" style={activeFilters.companies.includes(String(co.id)) ? { color: primaryColor } : {}}>{co.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsFilterPopupOpen(false)}
                className="w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Aplicar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABELA COM PAGINAÇÃO RESTAURADA */}
      <div className={`overflow-hidden rounded-[2.5rem] border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'}`}>
        <table className="w-full text-left table-fixed">
          <thead className="text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500">
            <tr>
              <th className="w-20 px-6 py-6 border-b border-slate-100 dark:border-slate-800">Identidade</th>
              <th className="px-6 py-6 w-1/3 border-b border-slate-100 dark:border-slate-800">Nome / Registro</th>
              <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800">Tipo</th>
              <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800">Status</th>
              <th className="px-6 py-6 text-right w-24 border-b border-slate-100 dark:border-slate-800">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedData?.length > 0 ? paginatedData.map((u, idx) => (
              <tr key={idx} className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 align-middle">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-inner flex items-center justify-center">
                    <img src={u.avatars?.url_imagem || u.foto_url || u.url_imagem || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-cover p-0.5" onError={(e) => e.currentTarget.src = 'https://i.ibb.co/JF2Gz3v8/logo.png'} />
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <p className={`font-black text-sm uppercase transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{u.nome || u.razao_social || u.titulo}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight">{u.email || u.cpf}</p>
                </td>
                <td className="px-6 py-4 text-center align-middle">
                   <span className="inline-block text-[9px] font-black uppercase px-4 py-2 rounded-xl" style={getUserBadgeStyle(u.tipo_usuario)}>{u.tipo_usuario || '-'}</span>
                </td>
                <td className="px-6 py-4 text-center align-middle">
                   <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${u.status === 'ATIVO' ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>{u.status}</span>
                </td>
                <td className="px-6 py-4 text-right align-middle">
                  <button onClick={() => handleEditUser(u)} className="p-3 rounded-xl transition-all text-slate-400 hover:text-yellow-500"><Edit3 size={20} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-6 py-24 text-center opacity-20"><Search size={64} className="mx-auto mb-4" /><p className="font-black uppercase tracking-[0.4em] text-sm">Nenhum registro encontrado</p></td></tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50/50 dark:bg-slate-800/30">
            <tr>
              <td colSpan={5} className="px-6 py-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Exibindo <span className="text-slate-600 dark:text-white">{(currentPage-1)*rowsPerPage+1}-{Math.min(currentPage*rowsPerPage, filtered.length)}</span> de <span className="text-slate-600 dark:text-white">{filtered.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Mostrar</span>
                       <select 
                         value={rowsPerPage}
                         onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                         className="bg-transparent text-[10px] font-black text-slate-500 uppercase outline-none cursor-pointer hover:text-primary transition-colors"
                         style={{ color: '#64748b' }}
                         onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                         onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                       >
                         <option value={10}>10 Linhas</option>
                         <option value={20}>20 Linhas</option>
                         <option value={50}>50 Linhas</option>
                         <option value={100}>100 Linhas</option>
                         <option value={filtered.length}>Mostrar Tudo</option>
                       </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const active = page === currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${active ? 'shadow-md scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
                          style={active ? { backgroundColor: primaryColor, color: contrastText } : {}}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO DE OPERADOR */}
      {viewMode === 'EDIT_USER' && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row h-[85vh]">
              {/* Sidebar do Modal */}
              <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 p-10 flex flex-col items-center border-r border-slate-100 dark:border-slate-800">
                <div className="relative group mb-8">
                  <div 
                    className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center relative cursor-pointer"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <img 
                      src={userForm.foto_perfil_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} 
                      className="w-full h-full object-cover" 
                      onError={(e) => e.currentTarget.src = 'https://i.ibb.co/JF2Gz3v8/logo.png'} 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <Edit3 className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Clique para alterar avatar</p>
                </div>

                <div className="w-full space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status da Conta</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black uppercase ${userForm.status === 'ATIVO' ? 'text-green-500' : 'text-red-500'}`}>{userForm.status}</span>
                      <button 
                        onClick={() => setUserForm({...userForm, status: userForm.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'})}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        {userForm.status === 'ATIVO' ? <ToggleRight className="text-green-500" size={24} /> : <ToggleLeft className="text-slate-300" size={24} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handlePrintUser(userForm)}
                    className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={16} /> Gerar Ficha PDF
                  </button>

                  <button 
                    onClick={() => handleDeleteClick(userForm)}
                    className="w-full py-4 rounded-2xl bg-red-50 text-red-500 border-2 border-red-100 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir Registro
                  </button>
                </div>
              </div>

              {/* Conteúdo do Modal */}
              <div className="flex-1 flex flex-col">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white">Perfil do Operador</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Único: #{userForm.id}</p>
                  </div>
                  <button onClick={() => setViewMode('LIST')} className="p-3 rounded-full hover:bg-slate-100 transition-all"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nome Completo</label>
                      <input type="text" className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-primary" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nível de Acesso</label>
                      <select 
                        className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none appearance-none cursor-pointer disabled:opacity-50" 
                        style={{ borderColor: hexToRgba(primaryColor, 0.1) }} 
                        value={userForm.tipo_usuario} 
                        disabled={userForm.tipo_usuario === 'LOGISTA'}
                        onChange={e => setUserForm({...userForm, tipo_usuario: e.target.value})}
                      >
                        <option value="MASTER">MASTER</option>
                        <option value="ADMIN">ADMINISTRATIVO</option>
                        <option value="LOGISTA" disabled>LOGISTA</option>
                      </select>
                      {userForm.tipo_usuario === 'LOGISTA' && <p className="text-[9px] font-bold text-amber-500 ml-1">Perfis de Logista não podem ser alterados para outros níveis.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">E-mail Corporativo</label>
                      <input type="email" className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">CPF</label>
                      <input type="text" className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={formatCPF(userForm.cpf)} onChange={handleCpfChange} />
                    </div>
                  </div>

                  {userForm.tipo_usuario === 'LOGISTA' && (
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                           <Building2 className="text-slate-400" size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Empresa Vinculada (Leitura)</p>
                          <p className="text-sm font-black uppercase text-slate-700 dark:text-white">{selectedCompany?.nome || 'Nenhuma empresa vinculada'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Segurança: Nova Senha</label>
                      <div className="relative">
                        <input 
                          type={passwordVisible ? 'text' : 'password'} 
                          className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none" 
                          style={{ borderColor: hexToRgba(primaryColor, 0.1) }} 
                          placeholder="Deixe em branco para manter"
                          value={editNewPassword} 
                          onChange={e => { setEditNewPassword(e.target.value); setIsPasswordUnlocked(true); }} 
                        />
                        <button onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">{passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Telefone</label>
                      <input type="text" className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={formatPhone(userForm.telefone)} onChange={e => setUserForm({...userForm, telefone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                  <button onClick={() => setViewMode('LIST')} className="px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                  <button 
                    onClick={handleSave} 
                    disabled={loading}
                    style={{ backgroundColor: primaryColor, color: contrastText }}
                    className="px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Alterações</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE AVATAR */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white">Galeria de Avatares</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escolha sua identidade digital</p>
                </div>
              </div>
              <button onClick={() => setIsAvatarModalOpen(false)} className="p-3 rounded-full hover:bg-slate-100 transition-all"><X /></button>
            </div>

            <div className="p-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {avatarsList.map((av) => {
                const isSelected = String(userForm.avatar_id) === String(av.id);
                return (
                  <button 
                    key={av.id}
                    onClick={() => setUserForm({...userForm, avatar_id: av.id, foto_perfil_url: av.url_imagem})}
                    className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 ${isSelected ? 'border-primary shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={isSelected ? { borderColor: primaryColor } : {}}
                  >
                    <img src={av.url_imagem} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.2) }}>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                          <Check size={16} style={{ color: primaryColor }} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={saveAvatarSelection}
                style={{ backgroundColor: primaryColor, color: contrastText }}
                className="px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
              >
                Confirmar Seleção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUTORIZAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-red-100 dark:border-red-900/30 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-red-500 text-white flex items-center justify-center shadow-2xl mb-6 animate-pulse">
                <Ban size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Autorização de Exclusão</h3>
              <p className="text-xs font-bold text-slate-400 mt-2">Esta ação requer autorização de um nível MASTER para o operador <span className="text-red-500">{userToDelete?.nome}</span>.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Justificativa da Exclusão</label>
                <textarea 
                  rows={3}
                  className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold text-sm outline-none focus:border-red-500 transition-all resize-none"
                  placeholder="Descreva o motivo da exclusão..."
                  value={deleteJustification}
                  onChange={e => setDeleteJustification(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Senha de um Usuário MASTER</label>
                <div className="relative">
                  <input 
                    type="password"
                    className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-red-500 transition-all"
                    placeholder="••••••••"
                    value={masterAuthPassword}
                    onChange={e => setMasterAuthPassword(e.target.value)}
                  />
                  <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => { setIsDeleteModalOpen(false); setDeleteJustification(''); setMasterAuthPassword(''); }}
                  className="flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAuthorizeDeletion}
                  disabled={loading || !deleteJustification || !masterAuthPassword}
                  className="flex-[2] py-5 rounded-2xl bg-red-500 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : "Confirmar Exclusão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO (WIZARD) */}
      {viewMode === 'CREATE_WIZARD' && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className={`w-full ${createStep === 'SELECT_TYPE' ? 'max-w-4xl' : 'max-w-xl'} rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'}`}>
              
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Novo Operador</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{createStep === 'SELECT_TYPE' ? 'Passo 1: Perfil' : `Passo 2: Formulário`}</p>
                  </div>
                </div>
                <button onClick={() => setViewMode('LIST')} className="p-3 rounded-full hover:bg-slate-100 transition-all"><X /></button>
              </div>

              {createStep === 'SELECT_TYPE' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5">
                   <button onClick={() => { setUserForm({...userForm, tipo_usuario: 'MASTER'}); setCreateStep('FILL_FORM'); }} className="group p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-6 hover:scale-[1.02] active:scale-95" style={{ borderColor: hexToRgba('#f59e0b', 0.1), background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(251,191,36,0.05) 100%)' }}>
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl" style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)' }}><ShieldCheck size={40} /></div>
                      <h4 className="font-black uppercase text-sm tracking-widest" style={{ color: '#f59e0b' }}>Master</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">Acesso irrestrito a todas as configurações e gestão global do sistema.</p>
                      <div className="mt-4 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: '#f59e0b', color: 'white' }}>Selecionar</div>
                   </button>
                   <button onClick={() => { setUserForm({...userForm, tipo_usuario: 'ADMIN'}); setCreateStep('FILL_FORM'); }} className="group p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-6 hover:scale-[1.02] active:scale-95" style={{ borderColor: hexToRgba(primaryColor, 0.1), background: `linear-gradient(135deg, rgba(251,191,36,0.05) 0%, ${hexToRgba(primaryColor, 0.05)} 100%)` }}>
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl" style={{ background: `linear-gradient(to right, #fbbf24, ${primaryColor})` }}><Briefcase size={40} /></div>
                      <h4 className="font-black uppercase text-sm tracking-widest" style={{ color: primaryColor }}>Administrativo</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">Gerenciamento de empresas, usuários e relatórios operacionais.</p>
                      <div className="mt-4 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: primaryColor, color: contrastText }}>Selecionar</div>
                   </button>
                   <button onClick={() => { setUserForm({...userForm, tipo_usuario: 'LOGISTA'}); setCreateStep('FILL_FORM'); }} className="group p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-6 hover:scale-[1.02] active:scale-95" style={{ borderColor: hexToRgba(primaryColor, 0.1), background: hexToRgba(primaryColor, 0.02) }}>
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: primaryColor }}><Store size={40} /></div>
                      <h4 className="font-black uppercase text-sm tracking-widest" style={{ color: primaryColor }}>Logista</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">Acesso restrito à gestão de vouchers e validação local.</p>
                      <div className="mt-4 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: primaryColor, color: contrastText }}>Selecionar</div>
                   </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-5">
                   {/* SELETOR DE EMPRESA COM LOGO */}
                   {userForm.tipo_usuario === 'LOGISTA' && (
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Empresa Vinculada (Obrigatório)</label>
                        <div className="relative" ref={companyDropdownRef}>
                          <button 
                            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                            className="w-full pl-6 pr-6 py-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none flex items-center justify-between transition-all"
                            style={{ borderColor: hexToRgba(primaryColor, 0.1) }}
                          >
                             <div className="flex items-center gap-4">
                                {selectedCompany ? (
                                   <>
                                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-white">
                                         <img src={selectedCompany.logo_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-contain" />
                                      </div>
                                      <span className="text-sm uppercase tracking-tight" style={{ color: primaryColor }}>{selectedCompany.nome}</span>
                                   </>
                                ) : (
                                   <>
                                      <Building2 size={20} className="text-slate-300" />
                                      <span className="text-slate-400 text-sm">Selecione a empresa do parceiro...</span>
                                   </>
                                )}
                             </div>
                             <ChevronDown className={`text-slate-400 transition-transform ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                          </button>

                          {isCompanyDropdownOpen && (
                             <div className="absolute top-full left-0 right-0 mt-2 z-[110] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 p-2">
                                <input 
                                  type="text" 
                                  placeholder="Buscar empresa..." 
                                  className="w-full p-3 mb-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-xs font-bold outline-none focus:border-yellow-500"
                                  value={companySearchTerm}
                                  onChange={(e) => setCompanySearchTerm(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {companiesList.filter(c => c.nome.toLowerCase().includes(companySearchTerm.toLowerCase())).map(co => (
                                   <button 
                                      key={co.id}
                                      onClick={() => { setUserForm({...userForm, empresa_id: co.id}); setIsCompanyDropdownOpen(false); }}
                                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-b last:border-0 rounded-xl"
                                   >
                                      <div className="w-10 h-10 rounded-full overflow-hidden border bg-white flex-shrink-0">
                                         <img src={co.logo_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-contain" />
                                      </div>
                                      <span className="font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300 text-left">{co.nome}</span>
                                   </button>
                                ))}
                             </div>
                          )}
                        </div>
                     </div>
                   )}

                   {isFormLocked && (
                     <div className="p-6 rounded-2xl flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 animate-pulse">
                        <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
                        <p className="text-xs font-bold text-amber-600">Selecione a empresa para liberar os campos.</p>
                     </div>
                   )}

                   <div className={`space-y-5 transition-all ${isFormLocked ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label><input type="text" className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail Corporativo</label><input type="email" className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF</label>
                          <input type="text" className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={formatCPF(userForm.cpf)} onChange={handleCpfChange} />
                          {cpfError && (
                            <p className={`text-[10px] font-bold ml-1 mt-1 ${cpfError === 'CPF Ok' ? 'text-green-500' : 'text-red-500'}`}>{cpfError}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone</label><input type="text" className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={formatPhone(userForm.telefone)} onChange={e => setUserForm({...userForm, telefone: e.target.value})} /></div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
                          <div className="relative">
                            <input type={passwordVisible ? 'text' : 'password'} className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.password} onChange={handlePasswordChange} />
                            <button onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">{passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                          </div>
                          {passwordError && (
                            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{passwordError}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data de Nascimento</label>
                          <input type="date" className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.data_nascimento} onChange={handleDobChange} />
                          {dobError && (
                            <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{dobError}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Gênero</label>
                          <select className="w-full p-5 rounded-2xl border-2 bg-slate-50 font-bold outline-none appearance-none cursor-pointer" style={{ borderColor: hexToRgba(primaryColor, 0.1) }} value={userForm.genero} onChange={e => setUserForm({...userForm, genero: e.target.value})}>
                            <option value="NAO_INFORMADO">Prefiro não informar</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMININO">Feminino</option>
                            <option value="OUTRO">Outro</option>
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button onClick={() => setCreateStep('SELECT_TYPE')} className="flex-1 py-5 rounded-2xl font-black uppercase text-xs tracking-widest border-2" style={{ borderColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>Voltar</button>
                      <button 
                        onClick={handleSave} 
                        disabled={loading || isFormLocked || !userForm.nome || !userForm.password} 
                        style={{ backgroundColor: primaryColor, color: contrastText }}
                        className="flex-[2] py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                         {loading ? <RefreshCw className="animate-spin" size={18} /> : <><Check size={18} /> CADASTRAR OPERADOR</>}
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
