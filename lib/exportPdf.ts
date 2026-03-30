"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type ExportPdfOptions = {
  element: HTMLElement;
  fileName: string;
  backgroundColor?: string;
};

export async function exportElementToPdf({
  element,
  fileName,
  backgroundColor = "#eef3f9"
}: ExportPdfOptions) {
  const canvas = await html2canvas(element, {
    backgroundColor,
    scale: 2,
    useCORS: true,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.clientWidth
  });

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;
  const pageContentHeight = pageHeight - margin * 2;
  const imageData = canvas.toDataURL("image/png");

  let remainingHeight = contentHeight;
  let offsetY = margin;

  pdf.addImage(imageData, "PNG", margin, offsetY, contentWidth, contentHeight, undefined, "FAST");
  remainingHeight -= pageContentHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    offsetY = margin - (contentHeight - remainingHeight);
    pdf.addImage(
      imageData,
      "PNG",
      margin,
      offsetY,
      contentWidth,
      contentHeight,
      undefined,
      "FAST"
    );
    remainingHeight -= pageContentHeight;
  }

  pdf.save(fileName);
}
