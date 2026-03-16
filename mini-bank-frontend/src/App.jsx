import { useEffect, useMemo, useState } from "react";
import {
  login,
  getDashboard,
  getBankSummary,
  getPublicBankSummary,
  deposit,
  transfer,
  getExtract,
  registerAccount,
  closeAccount,
  deleteClientByAccount,
} from "./api.js";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [bankSummary, setBankSummary] = useState(null);
  const [publicSummary, setPublicSummary] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [selectedAccount, setSelectedAccount] = useState(null);

  const [depositAmount, setDepositAmount] = useState("");
  const [transferForm, setTransferForm] = useState({
    toAccountId: "",
    amount: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

  function clearSession(showMsg = true) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setAccount(null);
    setAccounts([]);
    setTransactions([]);
    setBankSummary(null);
    if (showMsg) {
      setMessage("Token inválido ou expirado");
    }
  }

  async function loadPublicSummary() {
    try {
      const data = await getPublicBankSummary();

      if (data?.success) {
        setPublicSummary(data.data || null);
      }
    } catch (error) {
      console.error("Erro ao carregar resumo público:", error);
    }
  }

  async function loadDashboard(currentToken = token) {
    if (!currentToken) return;

    try {
      const [dashboardData, summaryData] = await Promise.all([
        getDashboard(currentToken),
        getBankSummary(currentToken),
      ]);

      if (dashboardData?.success) {
        setUser(dashboardData?.data?.user || null);
        setAccount(dashboardData?.data?.account || null);
        setAccounts(dashboardData?.data?.accounts || []);
        setTransactions(dashboardData?.data?.transactions || []);
      } else {
        const backendMessage = dashboardData?.message?.toLowerCase?.() || "";

        if (
          backendMessage.includes("token") ||
          backendMessage.includes("expirado") ||
          backendMessage.includes("inválido") ||
          backendMessage.includes("unauthorized") ||
          backendMessage.includes("não autorizado")
        ) {
          clearSession(true);
          return;
        }

        setMessage(dashboardData?.message || "Erro ao carregar dashboard");
      }

      if (summaryData?.success) {
        setBankSummary(summaryData?.data || null);
      }

      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setMessage("Erro ao carregar dashboard");
    }
  }

  useEffect(() => {
    loadPublicSummary();
  }, []);

  useEffect(() => {
    if (token && token.trim() !== "") {
      loadDashboard(token);
    }
  }, [token]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, item) => acc + Number(item.balance || 0), 0);
  }, [accounts]);

  const totalAccounts = useMemo(() => {
    return accounts.length;
  }, [accounts]);

  const activePercent = useMemo(() => {
    if (!bankSummary?.total_accounts) return 0;
    return Math.round(
      (Number(bankSummary.active_accounts || 0) /
        Number(bankSummary.total_accounts || 1)) *
        100
    );
  }, [bankSummary]);

  const closedPercent = useMemo(() => {
    if (!bankSummary?.total_accounts) return 0;
    return Math.round(
      (Number(bankSummary.closed_accounts || 0) /
        Number(bankSummary.total_accounts || 1)) *
        100
    );
  }, [bankSummary]);

  const rankingMaxBalance = useMemo(() => {
    const ranking = bankSummary?.ranking || [];
    if (!ranking.length) return 0;
    return Math.max(...ranking.map((item) => Number(item.balance || 0)));
  }, [bankSummary]);

  const publicRankingMaxBalance = useMemo(() => {
    const ranking = publicSummary?.public_ranking || [];
    if (!ranking.length) return 0;
    return Math.max(...ranking.map((item) => Number(item.balance || 0)));
  }, [publicSummary]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        (acc.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(acc.id || "").includes(searchTerm) ||
        String(acc.account_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ? true : (acc.status || "ativa") === statusFilter;

      const matchesType =
        typeFilter === "todos"
          ? true
          : (acc.account_type || "corrente") === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [accounts, searchTerm, statusFilter, typeFilter]);

  function formatMoney(value) {
    return Number(value || 0).toFixed(2);
  }

  function getAccountTypeLabel(type) {
    if (type === "corrente") return "Conta Corrente";
    if (type === "poupanca") return "Conta Poupança";
    return type || "Conta Corrente";
  }

  function getStatusLabel(status) {
    if (status === "ativa") return "Ativa";
    if (status === "inativa") return "Inativa";
    if (status === "bloqueada") return "Bloqueada";
    if (status === "encerrada") return "Encerrada";
    return status || "Ativa";
  }

  function isClosedAccount(acc) {
    return acc?.status === "encerrada";
  }

  function isOwnLoggedAccount(acc) {
    if (!user?.id || !acc?.user_id) return false;
    return Number(acc.user_id) === Number(user.id);
  }

  function canDeleteClient(acc) {
    if (!acc) return false;
    if (isOwnLoggedAccount(acc)) return false;
    return true;
  }

  function getDeleteClientReason(acc) {
    if (!acc) return "Conta inválida";
    if (isOwnLoggedAccount(acc)) {
      return "Você não pode excluir a própria conta enquanto estiver logado.";
    }
    return "";
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    try {
      const data = await login(loginForm.email, loginForm.password);

      if (data?.success && data?.data?.token) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        setToken(data.data.token);
        setUser(data.data.user);

        setLoginForm({
          email: "",
          password: "",
        });

        setMessage("Login realizado com sucesso");
      } else {
        setMessage(data?.message || "Email ou senha inválidos");
      }
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      setMessage("Erro ao realizar login");
    }
  }

  function openDepositModal(acc) {
    if (isClosedAccount(acc)) {
      setMessage("Conta encerrada não pode receber depósitos");
      return;
    }

    setSelectedAccount(acc);
    setDepositAmount("");
    setShowDepositModal(true);
  }

  function openTransferModal(acc) {
    if (isClosedAccount(acc)) {
      setMessage("Conta encerrada não pode realizar transferências");
      return;
    }

    setSelectedAccount(acc);
    setTransferForm({
      toAccountId: "",
      amount: "",
    });
    setShowTransferModal(true);
  }

  async function openExtractModal(acc) {
    try {
      const data = await getExtract(acc.id, token);

      if (data?.success) {
        setSelectedAccount(acc);
        setTransactions(data?.data || []);
        setShowExtractModal(true);
      } else {
        setMessage(data?.message || "Erro ao buscar extrato");
      }
    } catch (error) {
      console.error("Erro ao buscar extrato:", error);
      setMessage("Erro ao buscar extrato");
    }
  }

  async function handleDeposit() {
    if (!selectedAccount?.id) {
      setMessage("Selecione uma conta para depósito");
      return;
    }

    if (!depositAmount) {
      setMessage("Digite um valor para depósito");
      return;
    }

    try {
      const data = await deposit(selectedAccount.id, depositAmount, token);

      if (data?.success) {
        setMessage(data?.message || "Depósito realizado com sucesso");
        setShowDepositModal(false);
        setDepositAmount("");
        await loadDashboard();
        await loadPublicSummary();
      } else {
        setMessage(data?.message || "Erro ao depositar");
      }
    } catch (error) {
      console.error("Erro ao depositar:", error);
      setMessage("Erro ao conectar com o backend");
    }
  }

  async function handleTransfer() {
    if (!selectedAccount?.id) {
      setMessage("Selecione uma conta de origem");
      return;
    }

    if (!transferForm.toAccountId || !transferForm.amount) {
      setMessage("Preencha a conta de destino e o valor");
      return;
    }

    try {
      const data = await transfer(
        selectedAccount.id,
        transferForm.toAccountId,
        transferForm.amount,
        token
      );

      if (data?.success) {
        setMessage(data?.message || "Transferência realizada com sucesso");
        setTransferForm({
          toAccountId: "",
          amount: "",
        });
        setShowTransferModal(false);
        await loadDashboard();
        await loadPublicSummary();
      } else {
        setMessage(data?.message || "Erro ao transferir");
      }
    } catch (error) {
      console.error("Erro ao transferir:", error);
      setMessage("Erro ao conectar com o backend");
    }
  }

  async function handleRegisterAccount(e) {
    e.preventDefault();

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setMessage("Preencha nome, email e senha");
      return;
    }

    try {
      const data = await registerAccount(registerForm, token);

      if (data?.success) {
        setMessage(data?.message || "Conta criada com sucesso");
        setRegisterForm({
          name: "",
          email: "",
          password: "",
          role: "user",
        });
        setShowCreateAccountModal(false);
        await loadDashboard();
        await loadPublicSummary();
      } else {
        setMessage(data?.message || "Erro ao criar conta");
      }
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setMessage("Erro ao conectar com o backend");
    }
  }

  async function handleCloseAccount(acc) {
    const confirmed = window.confirm(
      `Tem certeza que deseja encerrar a conta "${acc.name}"?`
    );

    if (!confirmed) return;

    try {
      const data = await closeAccount(acc.id, token);

      if (data?.success) {
        setMessage(data?.message || "Conta encerrada com sucesso");
        await loadDashboard();
        await loadPublicSummary();
      } else {
        setMessage(data?.message || "Erro ao encerrar conta");
      }
    } catch (error) {
      console.error("Erro ao encerrar conta:", error);
      setMessage("Erro ao conectar com o backend");
    }
  }

  async function handleDeleteClient(acc) {
    const reason = getDeleteClientReason(acc);

    if (reason) {
      setMessage(reason);
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir completamente o cliente "${acc.name}"?\n\nEssa ação removerá usuário, conta(s) e transações.`
    );

    if (!confirmed) return;

    try {
      const data = await deleteClientByAccount(acc.id, token);

      if (data?.success) {
        setMessage(data?.message || "Cliente excluído com sucesso");
        await loadDashboard();
        await loadPublicSummary();
      } else {
        setMessage(data?.message || "Erro ao excluir cliente");
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      setMessage("Erro ao conectar com o backend");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setAccount(null);
    setAccounts([]);
    setTransactions([]);
    setBankSummary(null);
    setMessage("");
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f5f1f8] text-[#1f1534]">
        <header className="bg-[#f7f5f8] border-b border-[#e9ddf7]">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-[#820ad1] leading-none">
                Mini Bank
              </h1>
              <p className="text-[#8a33dd] mt-2 font-semibold">
                Simulador de Banco Criado por Thiago Fernandes
              </p>
              <p className="text-[#6d617d] mt-1">Projeto Full Stack em produção</p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <span className="rounded-full bg-[#efe7fb] px-4 py-2 text-sm font-bold text-[#7b2dd1]">
                React + Vite
              </span>
              <span className="rounded-full bg-[#efe7fb] px-4 py-2 text-sm font-bold text-[#7b2dd1]">
                Clojure API
              </span>
              <span className="rounded-full bg-[#efe7fb] px-4 py-2 text-sm font-bold text-[#7b2dd1]">
                JWT + SQLite
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch mb-10">
            <div className="rounded-[32px] bg-gradient-to-r from-[#8a2be2] to-[#a43cf0] text-white px-8 py-10 shadow-xl">
              <p className="text-base opacity-95 mb-3">Bem-vindo ao</p>
              <h2 className="text-5xl font-extrabold mb-4">Mini Bank</h2>
              <p className="text-xl opacity-95 mb-6 leading-relaxed">
                Um sistema bancário full stack com autenticação, dashboard,
                transferências, extrato, administração, ranking e analytics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-sm opacity-90">Tipo de projeto</p>
                  <p className="text-2xl font-extrabold mt-1">Portfólio real</p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-sm opacity-90">Ambiente</p>
                  <p className="text-2xl font-extrabold mt-1">Online na nuvem</p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-sm opacity-90">Autenticação</p>
                  <p className="text-2xl font-extrabold mt-1">JWT</p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <p className="text-sm opacity-90">Frontend</p>
                  <p className="text-2xl font-extrabold mt-1">React + Tailwind</p>
                </div>
              </div>
            </div>

            <div className="w-full bg-white rounded-[32px] shadow-xl border border-[#ede3f7] p-8">
              <h3 className="text-3xl font-extrabold text-[#17102b] mb-2">
                Entrar no sistema
              </h3>
              <p className="text-[#6b5c7a] mb-8">
                Faça login para acessar o painel administrativo e as operações do banco.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#5f5670] mb-2">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    placeholder="Digite seu email"
                    className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#5f5670] mb-2">Senha</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    placeholder="Digite sua senha"
                    className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#820ad1] py-3 font-bold text-white hover:bg-[#6f08b3] transition"
                >
                  Entrar
                </button>
              </form>

              {message && (
                <div className="mt-6 rounded-2xl border border-[#eadcf8] bg-[#f7f1fc] p-4 text-sm text-[#4d3f61]">
                  {message}
                </div>
              )}
            </div>
          </section>

          {publicSummary && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                  <p className="text-[#6d617d] mb-2">Clientes cadastrados</p>
                  <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                    {publicSummary.total_clients}
                  </h4>
                  <p className="text-sm text-[#8a7e9a] mt-2">
                    Total real de clientes vinculados às contas.
                  </p>
                </div>

                <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                  <p className="text-[#6d617d] mb-2">Contas ativas</p>
                  <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                    {publicSummary.active_accounts}
                  </h4>
                  <p className="text-sm text-[#8a7e9a] mt-2">
                    Contas disponíveis atualmente no sistema.
                  </p>
                </div>

                <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                  <p className="text-[#6d617d] mb-2">Saldo total do banco</p>
                  <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                    R$ {formatMoney(publicSummary.total_balance)}
                  </h4>
                  <p className="text-sm text-[#8a7e9a] mt-2">
                    Soma dos saldos disponíveis nas contas.
                  </p>
                </div>

                <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                  <p className="text-[#6d617d] mb-2">Total movimentado</p>
                  <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                    R$ {formatMoney(publicSummary.total_moved)}
                  </h4>
                  <p className="text-sm text-[#8a7e9a] mt-2">
                    Volume total de movimentações registradas.
                  </p>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
                <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                  <h3 className="text-2xl font-extrabold text-[#17102b] mb-5">
                    Recursos disponíveis
                  </h3>

                  <div className="space-y-4">
                    <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                      <p className="font-bold text-[#1d1431] text-lg">Autenticação segura</p>
                      <p className="text-[#6d617d] mt-1">
                        Controle de acesso com JWT e diferenciação de permissões administrativas.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                      <p className="font-bold text-[#1d1431] text-lg">Operações bancárias</p>
                      <p className="text-[#6d617d] mt-1">
                        Depósito, transferência, extrato, encerramento de conta e gestão de clientes.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                      <p className="font-bold text-[#1d1431] text-lg">Dashboard executivo</p>
                      <p className="text-[#6d617d] mt-1">
                        Resumo geral, métricas do banco, ranking por saldo e filtros avançados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                  <h3 className="text-2xl font-extrabold text-[#17102b] mb-5">
                    Ranking público por saldo
                  </h3>

                  <div className="space-y-4">
                    {(publicSummary.public_ranking || []).length === 0 ? (
                      <p className="text-[#6d617d]">Nenhum ranking público disponível.</p>
                    ) : (
                      publicSummary.public_ranking.map((item) => {
                        const width =
                          publicRankingMaxBalance > 0
                            ? Math.max(
                                8,
                                Math.round(
                                  (Number(item.balance || 0) / publicRankingMaxBalance) * 100
                                )
                              )
                            : 0;

                        return (
                          <div key={item.position}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-bold text-[#1d1431] text-lg">
                                  #{item.position} - {item.label}
                                </p>
                                <p className="text-[#6d617d] text-sm">
                                  Status: {getStatusLabel(item.status)}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="font-extrabold text-[#7b2dd1] text-xl">
                                  R$ {formatMoney(item.balance)}
                                </p>
                              </div>
                            </div>

                            <div className="w-full h-4 bg-[#f1e8fb] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#8a2be2] rounded-full"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {!publicSummary && (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Módulos do sistema</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">7+</h4>
                <p className="text-sm text-[#8a7e9a] mt-2">
                  Login, dashboard, contas, depósitos, transferências, extrato e admin.
                </p>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Arquitetura</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">Full Stack</h4>
                <p className="text-sm text-[#8a7e9a] mt-2">
                  Frontend moderno integrado a API REST com autenticação JWT.
                </p>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Deploy</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">Online</h4>
                <p className="text-sm text-[#8a7e9a] mt-2">
                  Frontend publicado na Vercel e backend publicado no Render.
                </p>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Objetivo</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">Portfólio</h4>
                <p className="text-sm text-[#8a7e9a] mt-2">
                  Projeto criado para demonstrar habilidades reais de engenharia de software.
                </p>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
              <h3 className="text-2xl font-extrabold text-[#17102b] mb-5">
                Tecnologias utilizadas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                  <p className="text-[#6d617d] text-sm">Frontend</p>
                  <p className="font-extrabold text-[#7b2dd1] text-xl mt-1">React + Vite</p>
                </div>

                <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                  <p className="text-[#6d617d] text-sm">Estilo</p>
                  <p className="font-extrabold text-[#7b2dd1] text-xl mt-1">Tailwind CSS</p>
                </div>

                <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                  <p className="text-[#6d617d] text-sm">Backend</p>
                  <p className="font-extrabold text-[#7b2dd1] text-xl mt-1">Clojure + Ring</p>
                </div>

                <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                  <p className="text-[#6d617d] text-sm">Banco de dados</p>
                  <p className="font-extrabold text-[#7b2dd1] text-xl mt-1">SQLite</p>
                </div>

                <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                  <p className="text-[#6d617d] text-sm">Autenticação</p>
                  <p className="font-extrabold text-[#7b2dd1] text-xl mt-1">JWT</p>
                </div>

                <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                  <p className="text-[#6d617d] text-sm">Deploy</p>
                  <p className="font-extrabold text-[#7b2dd1] text-xl mt-1">Render + Vercel</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
              <h3 className="text-2xl font-extrabold text-[#17102b] mb-4">
                Sobre este projeto
              </h3>
              <p className="text-[#6d617d] text-lg leading-relaxed">
                O Mini Bank foi desenvolvido como um projeto full stack para simular um ambiente
                bancário real, com foco em autenticação, gestão de contas, operações financeiras,
                painel administrativo e publicação em nuvem. A proposta é demonstrar domínio de
                frontend, backend, integração de APIs, banco de dados, segurança e deploy.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3eef7] text-[#1f1534]">
      <header className="bg-[#f7f5f8] border-b border-[#e9ddf7]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#820ad1] leading-none">
              Mini Bank
            </h1>
            <p className="text-[#8a33dd] mt-2 font-semibold">
              Simulador de Banco Criado por Thiago Fernandes
            </p>
            <p className="text-[#6d617d] mt-1">Banco digital simulado</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateAccountModal(true)}
              className="rounded-2xl bg-[#8a33dd] px-6 py-3 text-white font-bold hover:bg-[#7726c8] transition"
            >
              Criar conta
            </button>

            <button
              onClick={handleLogout}
              className="rounded-2xl bg-[#8a33dd] px-7 py-3 text-white font-bold hover:bg-[#7726c8] transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="rounded-[28px] bg-gradient-to-r from-[#8a2be2] to-[#a43cf0] text-white px-8 py-10 shadow-xl mb-10">
          <p className="text-base opacity-95 mb-3">Bem-vindo ao</p>
          <h2 className="text-5xl font-extrabold mb-4">Mini Bank Dashboard</h2>
          <p className="text-2xl opacity-95">
            Visualize suas contas e acompanhe seus saldos.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
            <p className="text-[#6d617d] text-lg mb-3">
              Saldo total de todas as contas
            </p>
            <h3 className="text-4xl font-extrabold text-[#7b2dd1]">
              R$ {formatMoney(totalBalance)}
            </h3>
          </div>

          <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
            <p className="text-[#6d617d] text-lg mb-3">
              Quantidade de contas no banco
            </p>
            <h3 className="text-4xl font-extrabold text-[#7b2dd1]">
              {totalAccounts}
            </h3>
          </div>
        </section>

        {bankSummary && (
          <>
            <section className="mb-8">
              <h3 className="text-3xl font-extrabold text-[#17102b] mb-2">
                Resumo geral do banco
              </h3>
              <p className="text-lg text-[#6d617d]">
                Visão administrativa e analytics do Mini Bank
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Total de clientes</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                  {bankSummary.total_clients}
                </h4>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Contas ativas</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                  {bankSummary.active_accounts}
                </h4>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Contas encerradas</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                  {bankSummary.closed_accounts}
                </h4>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <p className="text-[#6d617d] mb-2">Total movimentado</p>
                <h4 className="text-3xl font-extrabold text-[#7b2dd1]">
                  R$ {formatMoney(bankSummary.total_moved)}
                </h4>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <h4 className="text-2xl font-extrabold text-[#17102b] mb-5">
                  Distribuição de contas
                </h4>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-[#6d617d] mb-2">
                    <span>Ativas</span>
                    <span>{activePercent}%</span>
                  </div>
                  <div className="w-full h-4 bg-[#f1e8fb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8a2be2] rounded-full"
                      style={{ width: `${activePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-[#6d617d] mb-2">
                    <span>Encerradas</span>
                    <span>{closedPercent}%</span>
                  </div>
                  <div className="w-full h-4 bg-[#fde7ea] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d94b67] rounded-full"
                      style={{ width: `${closedPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <h4 className="text-2xl font-extrabold text-[#17102b] mb-5">
                  Destaques do banco
                </h4>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                    <p className="text-[#6d617d] text-sm mb-1">Maior saldo</p>
                    <p className="text-xl font-extrabold text-[#7b2dd1]">
                      {bankSummary.biggest_balance?.name || "N/A"}
                    </p>
                    <p className="text-[#6d617d] mt-1">
                      R$ {formatMoney(bankSummary.biggest_balance?.balance)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4">
                    <p className="text-[#6d617d] text-sm mb-1">Maior transferência</p>
                    <p className="text-xl font-extrabold text-[#7b2dd1]">
                      {bankSummary.biggest_transfer?.name || "N/A"}
                    </p>
                    <p className="text-[#6d617d] mt-1">
                      R$ {formatMoney(bankSummary.biggest_transfer?.amount)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
                <h4 className="text-2xl font-extrabold text-[#17102b] mb-4">
                  Ranking de clientes por saldo
                </h4>

                <div className="space-y-4">
                  {(bankSummary.ranking || []).length === 0 ? (
                    <p className="text-[#6d617d]">Nenhum cliente encontrado.</p>
                  ) : (
                    bankSummary.ranking.map((item, index) => {
                      const width =
                        rankingMaxBalance > 0
                          ? Math.max(
                              8,
                              Math.round(
                                (Number(item.balance || 0) / rankingMaxBalance) *
                                  100
                              )
                            )
                          : 0;

                      return (
                        <div key={item.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-bold text-[#1d1431] text-lg">
                                #{index + 1} - {item.name}
                              </p>
                              <p className="text-[#6d617d] text-sm">
                                Conta: {item.account_number || "N/A"} • Status:{" "}
                                {getStatusLabel(item.status)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-extrabold text-[#7b2dd1] text-xl">
                                R$ {formatMoney(item.balance)}
                              </p>
                            </div>
                          </div>

                          <div className="w-full h-4 bg-[#f1e8fb] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#8a2be2] rounded-full"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {message && (
          <div className="mb-6 rounded-2xl border border-[#eadcf8] bg-white p-4 text-[#4d3f61] shadow-sm">
            {message}
          </div>
        )}

        <section className="mb-8">
          <h3 className="text-4xl font-extrabold text-[#17102b] mb-2">
            Suas contas
          </h3>
          <p className="text-2xl text-[#6d617d] mb-6">
            Contas cadastradas no sistema bancário simulado
          </p>

          <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
              <div className="xl:col-span-2">
                <label className="block text-sm text-[#6d617d] mb-2">
                  Buscar por nome, ID ou número da conta
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex.: Thiago, 1, 100001-1"
                  className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#6d617d] mb-2">
                  Filtrar por status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
                >
                  <option value="todos">Todos</option>
                  <option value="ativa">Ativa</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="inativa">Inativa</option>
                  <option value="bloqueada">Bloqueada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#6d617d] mb-2">
                  Filtrar por tipo
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
                >
                  <option value="todos">Todos</option>
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Conta Poupança</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[#6d617d]">
                Exibindo <span className="font-bold text-[#2d2142]">{filteredAccounts.length}</span> de{" "}
                <span className="font-bold text-[#2d2142]">{accounts.length}</span> contas
              </p>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("todos");
                  setTypeFilter("todos");
                }}
                className="rounded-2xl bg-[#f1f1f4] px-5 py-2.5 font-bold text-[#2d2142] hover:bg-[#e8e8ee] transition"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAccounts.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-[#eadcf8] shadow-lg p-6">
              Nenhuma conta encontrada com os filtros aplicados.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const deleteDisabled = !canDeleteClient(acc);
              const deleteReason = getDeleteClientReason(acc);

              return (
                <div
                  key={acc.id}
                  className={`bg-white rounded-[28px] border shadow-lg p-6 min-h-[560px] flex flex-col ${
                    isClosedAccount(acc)
                      ? "border-[#ffd9de] bg-[#fffafb]"
                      : "border-[#eadcf8]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[#6d617d] text-lg">Conta</p>
                      <p className="text-sm text-[#8a7e9a] mt-1">
                        {getAccountTypeLabel(acc.account_type)}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-[#f1e4fb] flex items-center justify-center text-[#820ad1] font-bold text-xl">
                      $
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-4xl font-extrabold text-[#130d25]">
                      {acc.name}
                    </h4>
                    <p className="text-[#6d617d] text-lg mt-2">ID: {acc.id}</p>
                    <p className="text-[#6d617d] text-sm mt-1">
                      Cliente ID: {acc.user_id ?? "Não vinculado"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#faf7fd] border border-[#eadcf8] p-4 mb-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6d617d]">Agência</span>
                      <span className="font-bold text-[#2d2142]">
                        {acc.agency || "0001"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6d617d]">Conta</span>
                      <span className="font-bold text-[#2d2142]">
                        {acc.account_number || "Não informado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6d617d]">Tipo</span>
                      <span className="font-bold text-[#2d2142]">
                        {getAccountTypeLabel(acc.account_type)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6d617d]">Status</span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                          isClosedAccount(acc)
                            ? "bg-[#ffe4e8] text-[#c1121f]"
                            : "bg-[#efe7fb] text-[#7b2dd1]"
                        }`}
                      >
                        {getStatusLabel(acc.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-[#6d617d] text-xl mb-2">Saldo atual</p>
                    <h5
                      className={`text-5xl font-extrabold ${
                        isClosedAccount(acc) ? "text-[#9a8fa8]" : "text-[#7b2dd1]"
                      }`}
                    >
                      R$ {formatMoney(acc.balance)}
                    </h5>
                  </div>

                  <div className="mt-auto space-y-3">
                    <button
                      onClick={() => openDepositModal(acc)}
                      disabled={isClosedAccount(acc)}
                      className={`w-full rounded-2xl py-3 font-bold text-xl transition ${
                        isClosedAccount(acc)
                          ? "bg-[#ece8f0] text-[#9a8fa8] cursor-not-allowed"
                          : "bg-[#8a2be2] text-white hover:bg-[#7623c5]"
                      }`}
                    >
                      Depositar
                    </button>

                    <button
                      onClick={() => openTransferModal(acc)}
                      disabled={isClosedAccount(acc)}
                      className={`w-full rounded-2xl py-3 font-bold text-xl transition ${
                        isClosedAccount(acc)
                          ? "bg-[#ece8f0] text-[#9a8fa8] cursor-not-allowed"
                          : "bg-[#f1f1f4] text-[#2d2142] hover:bg-[#e8e8ee]"
                      }`}
                    >
                      Transferir
                    </button>

                    <button
                      onClick={() => openExtractModal(acc)}
                      className="w-full rounded-2xl bg-[#f1f1f4] py-3 text-[#2d2142] font-bold text-xl hover:bg-[#e8e8ee] transition"
                    >
                      Extrato
                    </button>

                    <button
                      onClick={() => handleCloseAccount(acc)}
                      disabled={isClosedAccount(acc)}
                      className={`w-full rounded-2xl py-3 font-bold text-xl transition ${
                        isClosedAccount(acc)
                          ? "bg-[#ece8f0] text-[#9a8fa8] cursor-not-allowed"
                          : "bg-[#fff7ed] text-[#b45309] border border-[#fde3c2] hover:bg-[#ffedd5]"
                      }`}
                    >
                      Encerrar conta
                    </button>

                    <button
                      onClick={() => handleDeleteClient(acc)}
                      disabled={deleteDisabled}
                      title={deleteReason || "Excluir cliente"}
                      className={`w-full rounded-2xl py-3 font-bold text-xl border transition ${
                        deleteDisabled
                          ? "bg-[#f4f4f5] text-[#a1a1aa] border-[#e4e4e7] cursor-not-allowed"
                          : "bg-[#fff1f2] text-[#c1121f] border-[#ffd6db] hover:bg-[#ffe4e8]"
                      }`}
                    >
                      {deleteDisabled ? "Exclusão bloqueada" : "Excluir cliente"}
                    </button>

                    {deleteReason && (
                      <p className="text-sm text-[#8a7e9a]">{deleteReason}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-3xl font-extrabold text-[#17102b] mb-4">
              Criar conta
            </h3>

            <form onSubmit={handleRegisterAccount} className="space-y-4">
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, name: e.target.value })
                }
                placeholder="Nome completo"
                className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
              />

              <input
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                placeholder="Email"
                className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
              />

              <input
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                placeholder="Senha"
                className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
              />

              <select
                value={registerForm.role}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, role: e.target.value })
                }
                className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="w-full rounded-2xl bg-[#f1f1f4] py-3 font-bold text-[#2d2142]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#820ad1] py-3 font-bold text-white"
                >
                  Criar conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-3xl font-extrabold text-[#17102b] mb-4">
              Depositar em {selectedAccount?.name}
            </h3>

            <input
              type="number"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Digite o valor"
              className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1] mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositModal(false)}
                className="w-full rounded-2xl bg-[#f1f1f4] py-3 font-bold text-[#2d2142]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeposit}
                className="w-full rounded-2xl bg-[#820ad1] py-3 font-bold text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-3xl font-extrabold text-[#17102b] mb-4">
              Transferir de {selectedAccount?.name}
            </h3>

            <div className="space-y-4">
              <input
                type="number"
                value={transferForm.toAccountId}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    toAccountId: e.target.value,
                  })
                }
                placeholder="ID da conta de destino"
                className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
              />

              <input
                type="number"
                step="0.01"
                value={transferForm.amount}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    amount: e.target.value,
                  })
                }
                placeholder="Valor da transferência"
                className="w-full rounded-2xl border border-[#e6d8f5] bg-[#faf7fd] px-4 py-3 outline-none focus:border-[#820ad1]"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-full rounded-2xl bg-[#f1f1f4] py-3 font-bold text-[#2d2142]"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransfer}
                className="w-full rounded-2xl bg-[#820ad1] py-3 font-bold text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showExtractModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-[28px] p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-extrabold text-[#17102b]">
                Extrato de {selectedAccount?.name}
              </h3>
              <button
                onClick={() => setShowExtractModal(false)}
                className="rounded-2xl bg-[#f1f1f4] px-4 py-2 font-bold text-[#2d2142]"
              >
                Fechar
              </button>
            </div>

            {transactions.length === 0 ? (
              <p className="text-[#6d617d]">Nenhuma movimentação encontrada.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#eadcf8] bg-[#faf7fd] p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-[#1d1431] text-lg">
                        {item.type || "Movimentação"}
                      </p>
                      <p className="text-[#6d617d]">
                        {item.description || item.name || "Sem descrição"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-[#7b2dd1] text-xl">
                        R$ {formatMoney(item.amount)}
                      </p>
                      <p className="text-sm text-[#8a7e9a]">
                        {item.created_at || item.timestamp || ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}