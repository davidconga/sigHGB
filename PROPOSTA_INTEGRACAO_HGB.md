# SIGHGB
## Sistema Integrado de Gestão do Hospital Geral de Benguela
### Proposta de Integração

---

**Versão:** 1.0  
**Data:** Maio de 2026  
**Destinatário:** Direcção do Hospital Geral de Benguela  
**Responsável técnico:** Okulandisa / DCM Developers  
**Acesso:** https://sig.hgbenguela.com

---

## 1. Resumo Executivo

O **SIGHGB** é uma plataforma integrada de gestão hospitalar desenvolvida especificamente para o Hospital Geral de Benguela. Substitui processos manuais e papelada por um sistema digital unificado de emissão de atestados, relatórios clínicos, gestão de pacientes, funcionários e comunicação por SMS — acessível **via web, aplicação Android e iPhone**.

O sistema **já está operacional em produção** com os dados históricos do hospital migrados:

| Indicador | Quantidade migrada |
|---|---|
| Pacientes | **11 808** |
| Atestados históricos | **13 932** |
| Relatórios clínicos históricos | **1 537** |
| Funcionários do hospital | **60** |
| Médicos cadastrados | 3 (em crescimento) |
| Códigos CID-10 internacionais | **14 233** |
| Províncias e municípios de Angola | 18 + 163 |

---

## 2. Módulos Disponíveis

### 2.1 Gestão Clínica
- **Pacientes**: cadastro completo (BI, filiação, naturalidade, contactos, grupo sanguíneo, alergias), pesquisa rápida, anexos digitais (BI fotografado, exames, prescrições).
- **Atestados Médicos** no formato oficial: aptidão (matrícula, trabalho, desporto, inscrição), comparecimento, repouso. Geração automática de PDF com brasão, QR code de verificação, dupla assinatura institucional e marca de água "RASCUNHO" até validação.
- **Relatórios Clínicos** em 6 categorias: Relatório Médico, Junta Médica, Fisioterapéutico, Informação Clínica, Nota de Alta, Guia de Transferência.
- **Consultas, Exames, Altas Hospitalares**.
- **Tabela CID-10** completa (14 233 códigos) com pesquisa autocomplete.

### 2.2 Validação e Segurança Documental
- Cada documento é **emitido como rascunho** com marca de água.
- O médico **valida com o nº de ordem + palavra-passe**: a marca de água é removida e o documento ganha valor legal.
- Cada documento inclui um **QR code único** que permite verificar a autenticidade em https://sig.hgbenguela.com/verificar/{código} (acesso público sem login).
- **Assinatura e carimbo digitais** do médico anexados ao PDF (upload de imagem ou desenho com o rato/dedo).

### 2.3 Comunicação
- **SMS automáticos** via TelcoSMS:
  - Notificação ao médico quando lhe é atribuído um atestado/relatório
  - **Aniversário automático** dos 60 funcionários
  - **SMS em massa** para departamentos, serviços ou todo o hospital
  - Histórico completo de envios e estatísticas
- **Push notifications** na app Android para médicos (notificação imediata quando há documento atribuído).

### 2.4 Gestão Administrativa
- **Utilizadores e permissões** (sistema ACL completo, 40+ permissões por recurso).
- **Departamentos e serviços** do hospital.
- **Auto-cadastro público** de médicos e funcionários (com aprovação obrigatória do administrador).
- **Configurações** do hospital (nome, endereço, directora, templates de SMS).

### 2.5 Auditoria
- **Registo automático** de cada alteração em pacientes, atestados, relatórios, médicos e utilizadores.
- Aba **"Histórico"** em cada documento mostra: quem alterou, quando, e o que mudou (campo por campo).
- Essencial para conformidade clínica e responsabilização.

### 2.6 Dashboard Analítico
- Gráficos de atestados por mês (últimos 12 meses)
- Distribuição de relatórios por tipo
- Top 10 efeitos de atestados (matrícula, trabalho, etc.)
- Volume de SMS últimos 7 dias
- **Aniversariantes próximos** (14 dias)
- Saldo TelcoSMS visível

---

## 3. Acesso Multi-plataforma

### 3.1 Web (PWA)
- **URL:** https://sig.hgbenguela.com
- Acessível de qualquer computador, tablet ou telemóvel via navegador moderno (Chrome, Firefox, Edge, Safari)
- **Instalável como app** (PWA): aparece no homescreen do telefone ou no menu do desktop, abre em fullscreen sem barra do browser
- **Offline shell**: arranque instantâneo mesmo sem rede; só os dados é que precisam de ligação
- Interface **totalmente responsiva** (desktop, tablet, telemóvel)

### 3.2 Android (APK nativo)
- **Download directo:** https://sig.hgbenguela.com/downloads/sighgb.apk (versão actual: 1.0.3)
- Instalação simples: descarregar e abrir o APK
- **Login biométrico** (impressão digital ou Face Unlock)
- Push notifications nativas
- Câmara integrada para fotografar BI/documentos do paciente
- Validação de assinatura, criação de SMS, consulta de processos

### 3.3 iPhone / iPad
- **Imediatamente disponível via Expo Go** (app gratuita da App Store): scan de QR code
- **Versão nativa (TestFlight/App Store):** necessita conta Apple Developer Program ($99/ano) — toda a configuração técnica do projecto já está preparada

---

## 4. Benefícios para o Hospital

| Antes (papel) | Depois (SIGHGB) |
|---|---|
| Atestados manuscritos sem rastreio | Atestados digitais com QR code de verificação |
| Sem cópia de segurança | Backup automático diário (30 dias de retenção) |
| Sem auditoria de alterações | Cada alteração registada com quem, quando, o quê |
| Sem rastreio de quem aprovou o quê | Validação obrigatória com nº de ordem + password |
| SMS manuais um a um | Envio em massa por departamento/todo o hospital |
| Aniversários esquecidos | SMS automático às 08:00 a cada aniversário |
| Pacientes duplicados no papel | Pesquisa unificada por BI, nome ou nº processo |
| Sem visão geral | Dashboard com métricas em tempo real |

---

## 5. Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────┐
│  Utilizadores: Médicos, Recepção, Direcção             │
│  ┌────────┐  ┌────────────┐  ┌────────┐                │
│  │  Web   │  │  Android   │  │ iPhone │                │
│  │ (PWA)  │  │   (APK)    │  │ (Expo) │                │
│  └────┬───┘  └──────┬─────┘  └────┬───┘                │
└───────┼─────────────┼─────────────┼────────────────────┘
        └─────────────┴─────────────┘
                      │ HTTPS
                      ▼
        ┌────────────────────────────┐
        │  Backend Laravel 12        │
        │  (sig.hgbenguela.com)      │
        │  - API REST                │
        │  - PDF generation          │
        │  - Push notifications      │
        │  - SMS dispatcher          │
        │  - Audit log               │
        └────────┬───────────────────┘
                 │
        ┌────────┴──────────┬───────────┬─────────────┐
        ▼                   ▼           ▼             ▼
   ┌─────────┐      ┌───────────┐  ┌────────┐  ┌────────────┐
   │ SQLite  │      │ TelcoSMS  │  │ Expo   │  │  Filesystem │
   │   DB    │      │  (Okul.)  │  │  Push  │  │  (anexos,   │
   │ (WAL)   │      │  Angola   │  │  API   │  │  signatures)│
   └─────────┘      └───────────┘  └────────┘  └─────────────┘
```

**Stack:**
- **Backend:** PHP 8.4 + Laravel 12, SQLite com WAL (suporta 14k+ atestados em produção sem degradação), Sanctum para autenticação API
- **Frontend Web:** React + Vite, Tailwind CSS, PWA com Service Worker
- **Mobile:** React Native + Expo SDK 56 (Android nativo + iOS preparado)
- **PDFs:** dompdf com templates personalizados
- **SMS:** Driver TelcoSMS (https://www.telcosms.co.ao)
- **Push:** Expo Push API (gratuito, ilimitado)
- **Permissões:** spatie/laravel-permission (sistema ACL granular)
- **Auditoria:** spatie/laravel-activitylog (registo completo)

---

## 6. Segurança

- **HTTPS obrigatório** (certificado SSL válido)
- **Bearer tokens** (Laravel Sanctum) com validação por requisição
- **Bcrypt** com 12 rounds para todas as passwords
- **Rate-limiting** no login (10/min) e registo público (5/min)
- **CSP e cabeçalhos de segurança** via nginx
- **Auto-cadastro com aprovação obrigatória** — ninguém entra sem o admin aprovar
- **Pendente/Activo/Rejeitado** como estados explícitos de utilizador
- **Backup diário automatizado** com 30 dias de retenção em local separado
- **Auditoria completa** de todas as alterações sensíveis
- **Validação dupla** de documentos (nº de ordem + password) — não basta ter login, é preciso confirmar a identidade do médico para cada assinatura
- **QR code de verificação pública** — qualquer entidade externa pode validar se um atestado é genuíno
- **Filtros anti-spam** — números de telefone obviamente falsos rejeitados antes de chegar à operadora (protege o saldo SMS)

---

## 7. Funcionamento Operacional

### 7.1 Para o Médico
1. **Recebe atestado/relatório atribuído** → SMS + push notification no telemóvel
2. **Abre o sistema** (web, Android ou iPhone) → login biométrico
3. **Revê o documento** em modo rascunho
4. **Valida com nº de ordem + password** → marca de água "RASCUNHO" desaparece
5. **Descarrega/imprime PDF** com assinatura + carimbo + QR code

### 7.2 Para a Recepção
1. **Pesquisa paciente** por nome, BI ou nº processo
2. **Cria atestado/relatório** em rascunho, escolhe médico
3. **Atribui ao médico** → médico recebe notificação automática
4. **Acompanha o estado** (rascunho → emitido)

### 7.3 Para a Direcção
1. **Dashboard** com métricas em tempo real
2. **Aprovação de novos médicos** que se registem via /registo
3. **Configurações do hospital** (templates SMS, dados institucionais)
4. **Auditoria** de todas as alterações

### 7.4 Para a Pessoa Externa (verificação pública)
1. Vê QR code num atestado/relatório impresso
2. Lê o QR com a câmara do telemóvel ou vai a `sig.hgbenguela.com/verificar/{código}`
3. **Sem login** — vê o documento original e confirma autenticidade

---

## 8. Custos Operacionais Mensais

| Item | Custo |
|---|---|
| Hospedagem VPS | **já existente** (incluído nos serviços actuais) |
| Domínio sig.hgbenguela.com | **já existente** |
| Certificado SSL | **grátis** (Let's Encrypt, renovação automática) |
| Push notifications (Expo) | **grátis** (ilimitado) |
| PWA / Service Worker | **grátis** |
| Backup local diário | **grátis** (incluído na VPS) |
| **SMS TelcoSMS** | depende do volume — actualmente conta a recarregar |
| **Apple Developer** (opcional, só para App Store iOS) | ~$99/ano (~85.000 AOA) |

**Total recorrente obrigatório:** apenas o consumo de SMS (TelcoSMS, pay-as-you-go).

---

## 9. Estado Actual (Maio 2026)

✅ **Em produção:** https://sig.hgbenguela.com  
✅ **APK Android** publicado e disponível para download  
✅ **Dados históricos importados** (11k pacientes, 14k atestados, 1.5k relatórios)  
✅ **Cron jobs activos:** backup diário, scheduler Laravel, SMS aniversários  
✅ **PWA instalável** em Android, iPhone e desktop  
✅ **Auditoria a registar** todas as alterações  
✅ **3 médicos demo** + 24 utilizadores históricos importados  

⏳ **Pendente:**
- Recarregar conta TelcoSMS para reactivar envio de SMS
- Conta Apple Developer (caso se opte por iOS nativo na App Store)
- Onboarding dos médicos reais (uso do auto-cadastro ou criação directa pelo admin)

---

## 10. Roadmap (próximos meses)

| Prioridade | Funcionalidade | Estimativa |
|---|---|---|
| Alta | Polir templates PDF de consultas, exames e altas | 1 semana |
| Alta | Modo offline mobile (cache de pacientes recentes) | 2 semanas |
| Média | Pesquisa global Ctrl+K | 3 dias |
| Média | Email notifications (complemento ao SMS) | 1 semana |
| Média | Editor rich-text mobile para criar relatórios | 2 semanas |
| Baixa | Multi-idioma (PT/EN) | 1 semana |
| Baixa | Integração com fila de espera / balcão | 3 semanas |
| Baixa | Sentry (monitorização de erros em produção) | 1 dia (depende de conta criada) |

---

## 11. Manutenção e Suporte

- **Repositório de código:** GitHub privado (acesso controlado)
- **Backup:** diário automático com 30 dias de retenção em `/home/hgbenguela-sig/backups/`
- **Logs:** centralizados em `/home/hgbenguela-sig/logs/` (nginx + PHP + Laravel + scheduler)
- **Actualizações:** push para o repo + pull na VPS, sem downtime
- **Roll-back:** qualquer backup pode ser restaurado em <5 minutos

---

## 12. Credenciais Iniciais

Para o primeiro acesso da Direcção:

| Perfil | Email | Password inicial |
|---|---|---|
| Administrador | `admin@hgb.ao` | `admin123` |
| Médico (demo) | `antonio.manuel@hgb.ao` | `medico123` |
| Recepção (demo) | `recepcao@hgb.ao` | `recepcao123` |

> **Importante:** após o primeiro login, **alterar imediatamente as palavras-passe** em "Perfil" no canto inferior do menu.

---

## 13. Próximos Passos Recomendados

1. **Validação da Direcção** da plataforma e dos templates de documentos
2. **Recarga da conta TelcoSMS** para activar comunicações
3. **Sessão de onboarding** com 2-3 médicos para captar feedback
4. **Lançamento controlado** durante 2 semanas com apenas um departamento
5. **Avaliação** e ajustes finos antes do lançamento total
6. **Formação** breve (1h) para recepção e médicos

---

## 14. Contacto

**Equipa técnica:**  
DCM Developers / Okulandisa  
Telefone: 935 698 185  
Email: d_conga@yahoo.fr  

**Documentação técnica completa:** disponível no repositório do projecto.

---

*Documento gerado a partir da plataforma em produção em Maio de 2026.*
