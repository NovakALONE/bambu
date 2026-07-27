import SwiftUI

// MARK: - Models
struct FilamentInfo: Identifiable {
    let id: String
    let density: Double      // g/cm³
    let nozzleTemp: String   // e.g. "190-230"
    let bedTemp: String      // e.g. "25-60"
    let maxSpeed: Int        // mm/s
    let difficulty: String
    let priceKg: Double      // R$
    let compat: String
}

struct PrintHistoryItem: Identifiable, Codable {
    var id = UUID()
    let name: String
    let filament: String
    let weightGrams: Double
    let totalTimeHours: Double
    let totalCost: Double
    let sellingPrice: Double
    let date: String
}

// MARK: - Database
let filamentDatabase: [FilamentInfo] = [
    FilamentInfo(id: "PLA", density: 1.24, nozzleTemp: "190–230 °C", bedTemp: "25–60 °C", maxSpeed: 500, difficulty: "Fácil", priceKg: 89.90, compat: "✓ Sim"),
    FilamentInfo(id: "PLA+", density: 1.27, nozzleTemp: "200–240 °C", bedTemp: "25–65 °C", maxSpeed: 400, difficulty: "Fácil", priceKg: 99.90, compat: "✓ Sim"),
    FilamentInfo(id: "PETG", density: 1.27, nozzleTemp: "220–250 °C", bedTemp: "70–85 °C", maxSpeed: 300, difficulty: "Médio", priceKg: 109.90, compat: "✓ Sim"),
    FilamentInfo(id: "ABS", density: 1.04, nozzleTemp: "230–260 °C", bedTemp: "90–110 °C", maxSpeed: 200, difficulty: "Difícil", priceKg: 79.90, compat: "~ Parcial"),
    FilamentInfo(id: "TPU", density: 1.20, nozzleTemp: "210–230 °C", bedTemp: "40–60 °C", maxSpeed: 150, difficulty: "Médio", priceKg: 129.90, compat: "✓ Sim"),
    FilamentInfo(id: "PETG-CF", density: 1.35, nozzleTemp: "240–270 °C", bedTemp: "70–90 °C", maxSpeed: 250, difficulty: "Médio", priceKg: 169.90, compat: "✓ Sim")
]

// MARK: - Main App Entry Point
@main
struct BambuCalcApp: App {
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .preferredColorScheme(.dark)
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    @State private var history: [PrintHistoryItem] = []
    
    var body: some View {
        TabView {
            CostCalculatorView(history: $history)
                .tabItem {
                    Label("Custo", systemImage: "banknote.fill")
                }
            
            TimeEstimatorView()
                .tabItem {
                    Label("Tempo", systemImage: "clock.fill")
                }
            
            FilamentGuideView()
                .tabItem {
                    Label("Filamento", systemImage: "shippingbox.fill")
                }
            
            HistoryView(history: $history)
                .tabItem {
                    Label("Histórico", systemImage: "list.bullet.rectangle.fill")
                }
        }
        .accentColor(Color(red: 0, green: 0.83, blue: 1.0))
    }
}

// MARK: - Tab 1: Custo
struct CostCalculatorView: View {
    @Binding var history: [PrintHistoryItem]
    
    @State private var selectedFilament = "PLA"
    @State private var spoolWeight: Double = 1000
    @State private var spoolPrice: Double = 89.90
    @State private var usedWeight: Double = 50
    @State private var powerWatts: Double = 200
    @State private var kwhPrice: Double = 0.85
    @State private var hours: Int = 2
    @State private var minutes: Int = 30
    @State private var laborRate: Double = 0
    @State private var deprecationRate: Double = 1.50
    @State private var profitMargin: Double = 30
    @State private var projectName: String = ""
    @State private var showToast = false
    @State private var toastMsg = ""

    // Calculations
    var totalTimeHours: Double { Double(hours) + Double(minutes) / 60.0 }
    var filamentCost: Double { (spoolPrice / max(1, spoolWeight)) * usedWeight }
    var energyCost: Double { (powerWatts / 1000.0) * totalTimeHours * kwhPrice }
    var laborCost: Double { laborRate * totalTimeHours }
    var deprecationCost: Double { deprecationRate * totalTimeHours }
    var totalCost: Double { filamentCost + energyCost + laborCost + deprecationCost }
    var sellingPrice: Double { totalCost * (1.0 + profitMargin / 100.0) }
    var profit: Double { sellingPrice - totalCost }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Filament Card
                    VStack(alignment: .leading, spacing: 14) {
                        HeaderLabel(title: "Filamento", icon: "cube.fill", color: .cyan)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(filamentDatabase) { fil in
                                    Button(action: {
                                        selectedFilament = fil.id
                                        spoolPrice = fil.priceKg
                                    }) {
                                        Text(fil.id)
                                            .font(.subheadline.bold())
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(selectedFilament == fil.id ? Color.cyan.opacity(0.25) : Color.white.opacity(0.06))
                                            .foregroundColor(selectedFilament == fil.id ? .cyan : .white)
                                            .cornerRadius(20)
                                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(selectedFilament == fil.id ? Color.cyan : Color.clear, lineWidth: 1))
                                    }
                                }
                            }
                        }

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Preço Carretel (R$)").font(.caption).foregroundColor(.gray)
                                TextField("89.90", value: $spoolPrice, format: .number)
                                    .keyboardType(.decimalPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                            VStack(alignment: .leading) {
                                Text("Peso Carretel (g)").font(.caption).foregroundColor(.gray)
                                TextField("1000", value: $spoolWeight, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Filamento Utilizado").font(.caption).foregroundColor(.gray)
                                Spacer()
                                Text("\(Int(usedWeight)) g").font(.subheadline.bold()).foregroundColor(.cyan)
                            }
                            Slider(value: $usedWeight, in: 1...500, step: 1)
                                .accentColor(.cyan)
                        }
                    }
                    .padding()
                    .background(Color(white: 0.08))
                    .cornerRadius(18)

                    // Energy Card
                    VStack(alignment: .leading, spacing: 14) {
                        HeaderLabel(title: "Energia & Tempo", icon: "bolt.fill", color: .yellow)

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Potência (W)").font(.caption).foregroundColor(.gray)
                                TextField("200", value: $powerWatts, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                            VStack(alignment: .leading) {
                                Text("Tarifa (R$/kWh)").font(.caption).foregroundColor(.gray)
                                TextField("0.85", value: $kwhPrice, format: .number)
                                    .keyboardType(.decimalPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                        }

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Horas").font(.caption).foregroundColor(.gray)
                                TextField("0", value: $hours, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                            VStack(alignment: .leading) {
                                Text("Minutos").font(.caption).foregroundColor(.gray)
                                TextField("0", value: $minutes, format: .number)
                                    .keyboardType(.numberPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                    .background(Color(white: 0.08))
                    .cornerRadius(18)

                    // Profit Margin Card
                    VStack(alignment: .leading, spacing: 14) {
                        HeaderLabel(title: "Margem & Extras", icon: "chart.line.uptrend.xyaxis", color: .purple)

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Mão de Obra (R$/h)").font(.caption).foregroundColor(.gray)
                                TextField("0", value: $laborRate, format: .number)
                                    .keyboardType(.decimalPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                            VStack(alignment: .leading) {
                                Text("Depreciação (R$/h)").font(.caption).foregroundColor(.gray)
                                TextField("1.50", value: $deprecationRate, format: .number)
                                    .keyboardType(.decimalPad)
                                    .padding(10)
                                    .background(Color.white.opacity(0.06))
                                    .cornerRadius(8)
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Margem de Lucro").font(.caption).foregroundColor(.gray)
                                Spacer()
                                Text("\(Int(profitMargin))%").font(.subheadline.bold()).foregroundColor(.purple)
                            }
                            Slider(value: $profitMargin, in: 0...200, step: 5)
                                .accentColor(.purple)
                        }

                        TextField("Nome do projeto (opcional)", text: $projectName)
                            .padding(10)
                            .background(Color.white.opacity(0.06))
                            .cornerRadius(8)
                    }
                    .padding()
                    .background(Color(white: 0.08))
                    .cornerRadius(18)

                    // Results Summary Card
                    VStack(spacing: 12) {
                        HeaderLabel(title: "Resumo de Custo", icon: "checkmark.seal.fill", color: .green)

                        ResultRow(label: "Filamento", value: filamentCost)
                        ResultRow(label: "Energia", value: energyCost)
                        ResultRow(label: "Mão de Obra", value: laborCost)
                        ResultRow(label: "Depreciação", value: deprecationCost)
                        Divider().background(Color.white.opacity(0.1))
                        ResultRow(label: "Custo Total", value: totalCost, isBold: true)
                        ResultRow(label: "Preço de Venda", value: sellingPrice, isHighlight: true)
                        ResultRow(label: "Lucro Estimado", value: profit, isGreen: true)

                        Button(action: saveCalc) {
                            Label("Salvar no Histórico", systemImage: "bookmark.fill")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(LinearGradient(gradient: Gradient(colors: [.cyan, .purple]), startPoint: .leading, endPoint: .trailing))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(Color.cyan.opacity(0.05))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.cyan.opacity(0.2), lineWidth: 1))
                    .cornerRadius(18)
                }
                .padding()
            }
            .navigationTitle("A1 Mini Calc")
        }
    }

    func saveCalc() {
        let name = projectName.isEmpty ? "Impressão #\(history.count + 1)" : projectName
        let item = PrintHistoryItem(
            name: name,
            filament: selectedFilament,
            weightGrams: usedWeight,
            totalTimeHours: totalTimeHours,
            totalCost: totalCost,
            sellingPrice: sellingPrice,
            date: Date().formatted(date: .numeric, time: .shortened)
        )
        history.insert(item, at: 0)
    }
}

// MARK: - Tab 2: Tempo
struct TimeEstimatorView: View {
    @State private var layerHeight: Double = 0.2
    @State private var speed: Double = 250
    @State private var volumeCm3: Double = 20
    @State private var infillPercent: Double = 15
    @State private var hasSupport: Bool = false

    var estimatedTimeMinutes: Double {
        let volMm3 = volumeCm3 * 1000
        let fillRatio = 0.25 + (infillPercent / 100.0) * 0.75
        let effectiveVol = volMm3 * fillRatio * (hasSupport ? 1.25 : 1.0)
        let lineLength = effectiveVol / (layerHeight * 0.4)
        let avgSpeed = speed * 0.6
        return (lineLength / avgSpeed) / 60.0
    }

    var hours: Int { Int(estimatedTimeMinutes) / 60 }
    var minutes: Int { Int(estimatedTimeMinutes) % 60 }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 16) {
                        HeaderLabel(title: "Estimativa de Tempo", icon: "timer", color: .cyan)

                        VStack(alignment: .leading) {
                            Text("Volume do Objeto (cm³): \(Int(volumeCm3))").font(.caption).foregroundColor(.gray)
                            Slider(value: $volumeCm3, in: 1...500, step: 1)
                        }

                        VStack(alignment: .leading) {
                            Text("Preenchimento (%): \(Int(infillPercent))%").font(.caption).foregroundColor(.gray)
                            Slider(value: $infillPercent, in: 0...100, step: 5)
                        }

                        Toggle("Suportes necessários", isOn: $hasSupport)

                        VStack(alignment: .center, spacing: 8) {
                            Text("\(hours)h \(minutes)min")
                                .font(.system(size: 44, weight: .black, design: .rounded))
                                .foregroundColor(.cyan)
                            Text("Tempo estimado de impressão na A1 Mini")
                                .font(.caption).foregroundColor(.gray)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.cyan.opacity(0.1))
                        .cornerRadius(16)
                    }
                    .padding()
                    .background(Color(white: 0.08))
                    .cornerRadius(18)
                }
                .padding()
            }
            .navigationTitle("Tempo de Impressão")
        }
    }
}

// MARK: - Tab 3: Filamentos
struct FilamentGuideView: View {
    var body: some View {
        NavigationView {
            List(filamentDatabase) { fil in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(fil.id).font(.headline).foregroundColor(.cyan)
                        Spacer()
                        Text("R$ \(fil.priceKg, specifier: "%.2f")/kg").font(.subheadline.bold())
                    }
                    HStack {
                        Label(fil.nozzleTemp, systemImage: "thermometer.medium").font(.caption).foregroundColor(.gray)
                        Spacer()
                        Text(fil.compat).font(.caption.bold()).foregroundColor(.green)
                    }
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Guia de Filamentos")
        }
    }
}

// MARK: - Tab 4: Histórico
struct HistoryView: View {
    @Binding var history: [PrintHistoryItem]

    var body: some View {
        NavigationView {
            List {
                if history.isEmpty {
                    Text("Nenhum cálculo salvo ainda.")
                        .foregroundColor(.gray)
                } else {
                    ForEach(history) { item in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(item.name).font(.headline)
                                Text("\(item.filament) · \(Int(item.weightGrams))g · \(item.date)")
                                    .font(.caption).foregroundColor(.gray)
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Text("R$ \(item.sellingPrice, specifier: "%.2f")")
                                    .font(.subheadline.bold()).foregroundColor(.cyan)
                                Text("Custo: R$ \(item.totalCost, specifier: "%.2f")")
                                    .font(.caption).foregroundColor(.gray)
                            }
                        }
                    }
                    .onDelete { indexSet in history.remove(atOffsets: indexSet) }
                }
            }
            .navigationTitle("Histórico")
        }
    }
}

// MARK: - Helpers
struct HeaderLabel: View {
    let title: String
    let icon: String
    let color: Color
    var body: some View {
        HStack {
            Image(systemName: icon).foregroundColor(color)
            Text(title).font(.headline)
        }
    }
}

struct ResultRow: View {
    let label: String
    let value: Double
    var isBold = false
    var isHighlight = false
    var isGreen = false

    var body: some View {
        HStack {
            Text(label).foregroundColor(isBold || isHighlight ? .white : .gray)
            Spacer()
            Text("R$ \(value, specifier: "%.2f")")
                .font(isHighlight ? .title3.bold() : (isBold ? .headline : .subheadline))
                .foregroundColor(isGreen ? .green : (isHighlight ? .cyan : .white))
        }
    }
}
