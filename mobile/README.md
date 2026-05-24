# SIGHGB Mobile

App Android (React Native + Expo) — **Sistema Integrado de Gestão do Hospital Geral de Benguela**.

## Arrancar em desenvolvimento

1. **Arranca primeiro o backend Laravel** em outro terminal:
   ```bash
   cd ../backend
   php artisan serve --port=8000 --host=0.0.0.0
   ```
   O `--host=0.0.0.0` é importante para que o telemóvel/emulador consigam aceder.

2. **Configura o IP do backend** em `src/api/client.js`:
   - **Emulador Android Studio**: usa `http://10.0.2.2:8000/api` (default já configurado)
   - **iOS Simulator**: usa `http://localhost:8000/api`
   - **Telemóvel físico** (mesma rede WiFi): substitui pelo IP da máquina, ex.: `http://192.168.1.50:8000/api`
     Para descobrir o IP no macOS: `ipconfig getifaddr en0`

3. **Instala o Expo Go** no telemóvel (Play Store) ou tem um emulador Android pronto.

4. **Arranca o Expo**:
   ```bash
   npm start
   ```
   Depois prime:
   - `a` para abrir no emulador Android
   - `i` para abrir no iOS Simulator
   - ou faz scan do QR code com o **Expo Go** no telemóvel físico

## Credenciais de teste

- Admin: `admin@hgb.ao` / `admin123`
- Médico: `antonio.manuel@hgb.ao` / `medico123`
- Recepção: `recepcao@hgb.ao` / `recepcao123`

## Funcionalidades

### Tabs principais
- **Início** — Dashboard com contadores e aniversariantes próximos
- **Atestados** — Lista filtrada, detalhe + **Validar e Assinar** (nº ordem + password)
- **Relatórios** — Lista, detalhe + Validar
- **Pacientes** — Pesquisa, detalhe com contadores de documentos
- **SMS** — Histórico + saldo TelcoSMS visível
- **Perfil** — Dados do utilizador, médico, **assinatura e carimbo digital**

### Notificações push 🔔
Quando o médico recebe um atestado ou relatório atribuído, recebe **automaticamente**:
1. **SMS** via TelcoSMS (sempre)
2. **Push notification** no telemóvel (se a app estiver instalada e logado)

O registo do token push acontece automaticamente ao fazer login. Permissão é pedida na primeira utilização. ⚠ **Só funciona em dispositivo físico** (não no Expo Go) após `eas build` — o Expo Go tem limitações com push em SDK 53+.

### PDF
Botão "Ver PDF" abre o documento no browser (passa token na URL).

---

## Build APK para instalação

### 1. Conta Expo (uma vez)
```bash
eas login
# usa a tua conta Expo (gratuita em https://expo.dev/signup)
```

### 2. Inicializar o projeto EAS (uma vez)
```bash
eas init
# Aceita criar o projeto. Vai escrever o projectId no app.json.
```

### 3. Build do APK
```bash
eas build --platform android --profile preview
```

A build corre nos servidores da Expo (~10–15 min). No fim, devolve um URL para descarregar o `.apk`. Instala em qualquer telemóvel Android (precisa permitir "fontes desconhecidas").

### Builds locais (mais lento mas grátis e privado)
```bash
eas build --platform android --profile preview --local
# Requer Android SDK + JDK instalados
```

---

## Próximos passos sugeridos

- [ ] Câmara para fotografar BI / anexar a paciente
- [ ] Login biométrico (impressão digital)
- [ ] Modo offline (cache de pacientes recentes)
- [ ] Editor rich-text mobile para criar relatórios
- [ ] Picker de paciente nativo + criar SMS direto da app
