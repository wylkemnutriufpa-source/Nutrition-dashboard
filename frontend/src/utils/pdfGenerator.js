import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Gera relatório PDF do progresso do paciente
 * @param {Object} patient - Dados do paciente
 * @param {Array} journeyData - Dados da jornada (peso, medidas)
 * @param {Object} professionalInfo - Informações do profissional
 */
export const generatePatientProgressReport = async (patient, journeyData, professionalInfo) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // ===== CABEÇALHO =====
  doc.setFontSize(20);
  doc.setTextColor(15, 118, 110); // teal-700
  doc.text('Relatório de Progresso', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // ===== INFORMAÇÕES DO PROFISSIONAL =====
  if (professionalInfo) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Profissional: ${professionalInfo.name}`, 14, yPosition);
    yPosition += 7;
    if (professionalInfo.email) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Email: ${professionalInfo.email}`, 14, yPosition);
      yPosition += 10;
    }
  }

  // ===== INFORMAÇÕES DO PACIENTE =====
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Dados do Paciente', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.text(`Nome: ${patient.name || 'N/A'}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Email: ${patient.email || 'N/A'}`, 14, yPosition);
  yPosition += 10;

  // ===== DADOS DA JORNADA =====
  if (journeyData && journeyData.length > 0) {
    const journey = journeyData[0]; // Pega o plano mais recente

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Plano Atual', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    if (journey.plan_name) {
      doc.text(`Nome do Plano: ${journey.plan_name}`, 14, yPosition);
      yPosition += 6;
    }

    if (journey.plan_start_date) {
      doc.text(`Início: ${format(new Date(journey.plan_start_date), 'dd/MM/yyyy')}`, 14, yPosition);
      yPosition += 6;
    }

    if (journey.plan_end_date) {
      doc.text(`Término: ${format(new Date(journey.plan_end_date), 'dd/MM/yyyy')}`, 14, yPosition);
      yPosition += 6;
    }

    if (journey.plan_duration_days) {
      doc.text(`Duração: ${journey.plan_duration_days} dias`, 14, yPosition);
      yPosition += 10;
    }

    // ===== EVOLUÇÃO DE PESO =====
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Evolução de Peso', 14, yPosition);
    yPosition += 8;

    const weightData = [
      ['Tipo', 'Peso (kg)', 'Diferença'],
      [
        'Peso Inicial',
        journey.initial_weight ? journey.initial_weight.toString() : 'N/A',
        '-'
      ],
      [
        'Peso Atual',
        journey.current_weight ? journey.current_weight.toString() : 'N/A',
        journey.initial_weight && journey.current_weight
          ? `${(journey.current_weight - journey.initial_weight).toFixed(1)} kg`
          : '-'
      ],
      [
        'Peso Meta',
        journey.target_weight ? journey.target_weight.toString() : 'N/A',
        journey.current_weight && journey.target_weight
          ? `${(journey.target_weight - journey.current_weight).toFixed(1)} kg restantes`
          : '-'
      ]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [weightData[0]],
      body: weightData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // ===== PROGRESSO =====
    if (journey.initial_weight && journey.current_weight && journey.target_weight) {
      const totalToLose = journey.initial_weight - journey.target_weight;
      const alreadyLost = journey.initial_weight - journey.current_weight;
      const progressPercentage = (alreadyLost / totalToLose) * 100;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Progresso:', 14, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.text(`${progressPercentage.toFixed(1)}% concluído`, 14, yPosition);
      yPosition += 5;
      doc.text(`Perdeu: ${alreadyLost.toFixed(1)} kg de ${totalToLose.toFixed(1)} kg`, 14, yPosition);
      yPosition += 10;
    }

    // ===== OBSERVAÇÕES =====
    if (journey.notes) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Observações', 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(journey.notes, pageWidth - 28);
      doc.text(splitNotes, 14, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }
  } else {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum dado de jornada disponível.', 14, yPosition);
  }

  // ===== RODAPÉ =====
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // ===== SALVAR PDF =====
  const fileName = `relatorio_${patient.name?.replace(/\s+/g, '_') || 'paciente'}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};

/**
 * Gera relatório simplificado de peso
 */
export const generateWeightReport = (patient, journeyData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110);
  doc.text('Relatório de Peso', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Paciente: ${patient.name}`, 14, 35);

  if (journeyData && journeyData[0]) {
    const journey = journeyData[0];
    
    const data = [
      ['Medida', 'Valor'],
      ['Peso Inicial', journey.initial_weight ? `${journey.initial_weight} kg` : 'N/A'],
      ['Peso Atual', journey.current_weight ? `${journey.current_weight} kg` : 'N/A'],
      ['Peso Meta', journey.target_weight ? `${journey.target_weight} kg` : 'N/A'],
      [
        'Perdido',
        journey.initial_weight && journey.current_weight
          ? `${(journey.initial_weight - journey.current_weight).toFixed(1)} kg`
          : 'N/A'
      ]
    ];

    doc.autoTable({
      startY: 45,
      head: [data[0]],
      body: data.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [15, 118, 110] }
    });
  }

  doc.save(`peso_${patient.name?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
