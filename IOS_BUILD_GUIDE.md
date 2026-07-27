# 📱 Guia de Conversão para iOS — Bambu Calc A1 Mini

Você possui **2 opções principais** para usar/instalar o aplicativo no iOS (iPhone / iPad):

---

## 🚀 Opção 1: Web App PWA (Mais Rápida — Sem precisar de Mac/Xcode)

O projeto foi configurado com suporte a **PWA (Progressive Web App)** nativo do iOS.

### Como instalar no iPhone/iPad:
1. Hospede a pasta `bambu-calc` (por exemplo no GitHub Pages, Vercel ou Netlify).
2. Abra o link no **Safari** do seu iPhone/iPad.
3. Toque no botão de **Compartilhar** (ícone com quadrado e seta para cima).
4. Selecione **"Adicionar à Tela de Início"** (*Add to Home Screen*).
5. O ícone do **Bambu Calc** aparecerá na sua tela inicial e funcionará como um **app nativo em tela cheia**, inclusive **offline**!

---

## 🛠️ Opção 2: App Nativo em Swift / SwiftUI (`BambuCalcApp.swift`)

Criamos o código-fonte **100% nativo em Swift** para iOS usando SwiftUI no arquivo [`BambuCalcApp.swift`](file:///C:/Users/EvandroNovak/.gemini/antigravity/scratch/bambu-calc/BambuCalcApp.swift).

### Como compilar e rodar no Xcode (Mac):
1. Abra o **Xcode** no Mac.
2. Crie um novo projeto: **App (iOS)** → **SwiftUI**.
3. Substitua o conteúdo do arquivo `ContentView.swift` / `App.swift` pelo conteúdo de [`BambuCalcApp.swift`](file:///C:/Users/EvandroNovak/.gemini/antigravity/scratch/bambu-calc/BambuCalcApp.swift).
4. Conecte seu iPhone ou selecione um simulador iOS.
5. Clique em **Run (Cmd + R)** para rodar no iPhone!

*Dica: Você também pode abrir o arquivo `BambuCalcApp.swift` diretamente no aplicativo **Swift Playgrounds** do iPad ou Mac!*

---

## 📦 Opção 3: Empacotar HTML/JS com Capacitor (Capacitor iOS App)

Se você quiser transformar a versão HTML/CSS/JS em um projeto Xcode `.xcodeproj`:

No seu terminal com Node.js instalado:
```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Bambu Calc" "com.bambucalc.a1mini" --web-dir .
npx cap add ios
npx cap open ios
```
Isso abrirá o projeto nativo gerado no Xcode pronto para compilação.
