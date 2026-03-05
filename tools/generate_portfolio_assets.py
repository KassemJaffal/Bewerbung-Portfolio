from __future__ import annotations

import csv
import math
import zipfile
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS = ROOT / "downloads"
WEBSITE_URL = "https://retupzu.github.io/sc-freiburg-bewerbung/"


DATA = [
    {"ticket_id": "SR-101", "date": "2026-02-03", "location": "Freiburg HQ", "category": "Hardware", "priority": "High", "status": "Resolved", "device": "Dell Latitude", "resolution_hours": 3.5, "sla_met": "Yes"},
    {"ticket_id": "SR-102", "date": "2026-02-03", "location": "Service Desk", "category": "Accounts", "priority": "Medium", "status": "Resolved", "device": "Microsoft 365", "resolution_hours": 2.8, "sla_met": "Yes"},
    {"ticket_id": "SR-103", "date": "2026-02-04", "location": "Freiburg HQ", "category": "Network", "priority": "High", "status": "Resolved", "device": "Cisco Switch", "resolution_hours": 6.0, "sla_met": "Yes"},
    {"ticket_id": "SR-104", "date": "2026-02-04", "location": "Commerce Area", "category": "Software", "priority": "Low", "status": "Resolved", "device": "VMware Workstation", "resolution_hours": 4.5, "sla_met": "Yes"},
    {"ticket_id": "SR-105", "date": "2026-02-04", "location": "Warehouse", "category": "Hardware", "priority": "Medium", "status": "Resolved", "device": "Barcode Scanner", "resolution_hours": 3.8, "sla_met": "Yes"},
    {"ticket_id": "SR-106", "date": "2026-02-05", "location": "Service Desk", "category": "Accounts", "priority": "Medium", "status": "Resolved", "device": "Active Directory", "resolution_hours": 8.2, "sla_met": "Yes"},
    {"ticket_id": "SR-107", "date": "2026-02-05", "location": "Freiburg HQ", "category": "Network", "priority": "High", "status": "Resolved", "device": "Access Point", "resolution_hours": 7.3, "sla_met": "Yes"},
    {"ticket_id": "SR-108", "date": "2026-02-05", "location": "Commerce Area", "category": "Hardware", "priority": "High", "status": "Resolved", "device": "POS Terminal", "resolution_hours": 10.5, "sla_met": "No"},
    {"ticket_id": "SR-109", "date": "2026-02-06", "location": "Service Desk", "category": "Accounts", "priority": "Low", "status": "Resolved", "device": "User Account", "resolution_hours": 6.7, "sla_met": "Yes"},
    {"ticket_id": "SR-110", "date": "2026-02-06", "location": "Freiburg HQ", "category": "Software", "priority": "Medium", "status": "Resolved", "device": "Cisco AnyConnect", "resolution_hours": 5.8, "sla_met": "Yes"},
    {"ticket_id": "SR-111", "date": "2026-02-06", "location": "Warehouse", "category": "Hardware", "priority": "Medium", "status": "Resolved", "device": "Printer", "resolution_hours": 9.4, "sla_met": "Yes"},
    {"ticket_id": "SR-112", "date": "2026-02-07", "location": "Service Desk", "category": "Accounts", "priority": "Low", "status": "Resolved", "device": "Password Reset", "resolution_hours": 3.8, "sla_met": "Yes"},
    {"ticket_id": "SR-113", "date": "2026-02-07", "location": "Freiburg HQ", "category": "Network", "priority": "Medium", "status": "Resolved", "device": "Cisco Firewall", "resolution_hours": 7.8, "sla_met": "Yes"},
    {"ticket_id": "SR-114", "date": "2026-02-08", "location": "Commerce Area", "category": "Hardware", "priority": "Medium", "status": "Resolved", "device": "Checkout PC", "resolution_hours": 9.9, "sla_met": "Yes"},
    {"ticket_id": "SR-115", "date": "2026-02-08", "location": "Freiburg HQ", "category": "Network", "priority": "High", "status": "Resolved", "device": "VLAN Routing", "resolution_hours": 12.3, "sla_met": "No"},
    {"ticket_id": "SR-116", "date": "2026-02-09", "location": "Service Desk", "category": "Accounts", "priority": "Medium", "status": "Resolved", "device": "Teams Access", "resolution_hours": 5.6, "sla_met": "Yes"},
    {"ticket_id": "SR-117", "date": "2026-02-09", "location": "Commerce Area", "category": "Hardware", "priority": "Medium", "status": "Resolved", "device": "Monitor", "resolution_hours": 6.7, "sla_met": "Yes"},
    {"ticket_id": "SR-118", "date": "2026-02-10", "location": "Freiburg HQ", "category": "Software", "priority": "Low", "status": "Resolved", "device": "Virtual Machine", "resolution_hours": 8.1, "sla_met": "Yes"},
    {"ticket_id": "SR-119", "date": "2026-02-10", "location": "Warehouse", "category": "Hardware", "priority": "Low", "status": "Resolved", "device": "Label Printer", "resolution_hours": 6.4, "sla_met": "Yes"},
    {"ticket_id": "SR-120", "date": "2026-02-11", "location": "Service Desk", "category": "Accounts", "priority": "Medium", "status": "Resolved", "device": "Mailbox", "resolution_hours": 7.2, "sla_met": "Yes"},
    {"ticket_id": "SR-121", "date": "2026-02-11", "location": "Freiburg HQ", "category": "Software", "priority": "Medium", "status": "Resolved", "device": "Cisco Jabber", "resolution_hours": 8.8, "sla_met": "Yes"},
    {"ticket_id": "SR-122", "date": "2026-02-12", "location": "Service Desk", "category": "Accounts", "priority": "Low", "status": "Resolved", "device": "File Access", "resolution_hours": 5.9, "sla_met": "Yes"},
    {"ticket_id": "SR-123", "date": "2026-02-12", "location": "Freiburg HQ", "category": "Network", "priority": "Medium", "status": "Resolved", "device": "Patch Panel", "resolution_hours": 6.4, "sla_met": "Yes"},
    {"ticket_id": "SR-124", "date": "2026-02-13", "location": "Commerce Area", "category": "Hardware", "priority": "Low", "status": "Resolved", "device": "Thin Client", "resolution_hours": 6.8, "sla_met": "Yes"},
]


def pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def hours(value: float) -> str:
    return f"{value:.1f} h".replace(".", ",")


def compute_summary() -> dict[str, object]:
    total_tickets = len(DATA)
    avg_resolution = sum(row["resolution_hours"] for row in DATA) / total_tickets
    sla_met = sum(1 for row in DATA if row["sla_met"] == "Yes")

    category_counts: dict[str, int] = {}
    priority_counts: dict[str, int] = {}
    volume_by_day: dict[str, int] = {}

    for row in DATA:
        category_counts[row["category"]] = category_counts.get(row["category"], 0) + 1
        priority_counts[row["priority"]] = priority_counts.get(row["priority"], 0) + 1
        volume_by_day[row["date"]] = volume_by_day.get(row["date"], 0) + 1

    same_day = sum(1 for row in DATA if row["resolution_hours"] <= 8)

    return {
        "tickets": total_tickets,
        "avg_resolution": avg_resolution,
        "sla_rate": sla_met / total_tickets,
        "hardware_cases": category_counts.get("Hardware", 0),
        "same_day_rate": same_day / total_tickets,
        "category_counts": category_counts,
        "priority_counts": priority_counts,
        "volume_by_day": volume_by_day,
    }


SUMMARY = compute_summary()


def write_csv() -> None:
    DOWNLOADS.mkdir(exist_ok=True)
    target = DOWNLOADS / "bechtle_service_requests.csv"
    headers = ["ticket_id", "date", "location", "category", "priority", "status", "device", "resolution_hours", "sla_met"]
    with target.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, headers)
        writer.writeheader()
        writer.writerows(DATA)


def cell_reference(row: int, column: int) -> str:
    letters = ""
    index = column
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(65 + remainder) + letters
    return f"{letters}{row}"


def text_cell(ref: str, value: str) -> str:
    return f'<c r="{ref}" t="inlineStr"><is><t>{escape(value)}</t></is></c>'


def number_cell(ref: str, value: float) -> str:
    if math.isclose(value, round(value)):
        shown = str(int(round(value)))
    else:
        shown = f"{value:.4f}".rstrip("0").rstrip(".")
    return f'<c r="{ref}"><v>{shown}</v></c>'


def build_sheet(rows: list[list[object]]) -> str:
    row_xml: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cells: list[str] = []
        for col_index, value in enumerate(row, start=1):
            ref = cell_reference(row_index, col_index)
            if isinstance(value, (int, float)):
                cells.append(number_cell(ref, float(value)))
            else:
                cells.append(text_cell(ref, str(value)))
        row_xml.append(f'<row r="{row_index}">{"".join(cells)}</row>')
    dimension = f"A1:{cell_reference(len(rows), max(len(row) for row in rows))}"
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<dimension ref="{dimension}"/>'
        '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
        '<sheetFormatPr defaultRowHeight="15"/>'
        f'<sheetData>{"".join(row_xml)}</sheetData>'
        '</worksheet>'
    )


def write_xlsx() -> None:
    service_rows: list[list[object]] = [[
        "Ticket ID",
        "Date",
        "Location",
        "Category",
        "Priority",
        "Status",
        "Device",
        "Resolution Hours",
        "SLA Met",
    ]]
    for row in DATA:
        service_rows.append([
            row["ticket_id"],
            row["date"],
            row["location"],
            row["category"],
            row["priority"],
            row["status"],
            row["device"],
            row["resolution_hours"],
            row["sla_met"],
        ])

    dashboard_rows: list[list[object]] = [
        ["Bechtle IT Service Dashboard", "", ""],
        ["Metric", "Value", "Note"],
        ["Tickets", SUMMARY["tickets"], "Sample service requests"],
        ["Average resolution hours", round(float(SUMMARY["avg_resolution"]), 1), "Average handling time"],
        ["SLA rate", round(float(SUMMARY["sla_rate"]) * 100, 1), "Percent"],
        ["Same-day resolution", round(float(SUMMARY["same_day_rate"]) * 100, 1), "Percent"],
        ["Hardware cases", SUMMARY["hardware_cases"], "Recurring device topics"],
        ["", "", ""],
        ["Category", "Count", ""],
    ]
    for category, count in SUMMARY["category_counts"].items():
        dashboard_rows.append([category, count, ""])

    dashboard_rows.extend([
        ["", "", ""],
        ["Priority", "Count", ""],
    ])
    for priority, count in SUMMARY["priority_counts"].items():
        dashboard_rows.append([priority, count, ""])

    dashboard_rows.extend([
        ["", "", ""],
        ["Date", "Tickets", ""],
    ])
    for day, count in SUMMARY["volume_by_day"].items():
        dashboard_rows.append([day, count, ""])

    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets>'
        '<sheet name="ServiceData" sheetId="1" r:id="rId1"/>'
        '<sheet name="Dashboard" sheetId="2" r:id="rId2"/>'
        '</sheets>'
        '</workbook>'
    )
    workbook_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        '</Relationships>'
    )
    styles_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        '</styleSheet>'
    )
    package_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        '</Relationships>'
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        '</Types>'
    )
    core_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>Bechtle IT Service Excel Pack</dc:title>'
        '<dc:creator>Codex</dc:creator>'
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{date.today().isoformat()}T00:00:00Z</dcterms:created>'
        '</cp:coreProperties>'
    )
    app_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        '<Application>Codex</Application>'
        '</Properties>'
    )

    target = DOWNLOADS / "Bechtle_IT_Service_ExcelPack.xlsx"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", package_rels)
        archive.writestr("docProps/core.xml", core_xml)
        archive.writestr("docProps/app.xml", app_xml)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/styles.xml", styles_xml)
        archive.writestr("xl/worksheets/sheet1.xml", build_sheet(service_rows))
        archive.writestr("xl/worksheets/sheet2.xml", build_sheet(dashboard_rows))


def ascii_safe(value: str) -> str:
    replacements = {
        "ä": "ae",
        "ö": "oe",
        "ü": "ue",
        "Ä": "Ae",
        "Ö": "Oe",
        "Ü": "Ue",
        "ß": "ss",
        "·": "-",
        "–": "-",
        "—": "-",
        "’": "'",
        "“": '"',
        "”": '"',
    }
    return "".join(replacements.get(char, char if ord(char) < 128 else "") for char in value)


def escape_pdf(value: str) -> str:
    return ascii_safe(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def pdf_text(x: int, y: int, text: str, *, size: int = 11, font: str = "F1") -> str:
    return f"BT /{font} {size} Tf {x} {y} Td ({escape_pdf(text)}) Tj ET"


def pdf_fill(x: int, y: int, width: int, height: int, *, rgb: tuple[float, float, float]) -> str:
    red, green, blue = rgb
    return f"{red:.2f} {green:.2f} {blue:.2f} rg\n{x} {y} {width} {height} re f"


def build_pdf(pages: list[bytes]) -> bytes:
    page_count = len(pages)
    catalog_id = 1
    pages_id = 2
    regular_font_id = 3
    bold_font_id = 4
    page_ids = [5 + index for index in range(page_count)]
    content_ids = [5 + page_count + index for index in range(page_count)]

    objects: dict[int, bytes] = {
        catalog_id: f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("ascii"),
        pages_id: (
            f"<< /Type /Pages /Count {page_count} /Kids [{' '.join(f'{page_id} 0 R' for page_id in page_ids)}] >>"
        ).encode("ascii"),
        regular_font_id: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        bold_font_id: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    }

    for index, content in enumerate(pages):
        page_id = page_ids[index]
        content_id = content_ids[index]
        objects[page_id] = (
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 {regular_font_id} 0 R /F2 {bold_font_id} 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
        ).encode("ascii")
        objects[content_id] = b"<< /Length " + str(len(content)).encode("ascii") + b" >>\nstream\n" + content + b"\nendstream"

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for object_id in range(1, max(objects) + 1):
        offsets.append(len(pdf))
        pdf.extend(f"{object_id} 0 obj\n".encode("ascii"))
        pdf.extend(objects[object_id])
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {max(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        (
            "trailer\n"
            f"<< /Size {max(objects) + 1} /Root {catalog_id} 0 R >>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF\n"
        ).encode("ascii")
    )
    return bytes(pdf)


def service_pdf_stream() -> bytes:
    category_counts = SUMMARY["category_counts"]
    lines = [
        "q",
        pdf_fill(36, 744, 523, 56, rgb=(0.06, 0.55, 0.30)),
        "Q",
        pdf_text(48, 772, "Bechtle IT Service Dashboard", size=24, font="F2"),
        pdf_text(48, 752, "Bewerbungsprojekt zu Serviceanfragen, Prioritaeten, SLA und Dokumentation.", size=11),
        pdf_fill(48, 676, 116, 52, rgb=(0.18, 0.68, 0.39)),
        pdf_fill(168, 676, 116, 52, rgb=(0.18, 0.68, 0.39)),
        pdf_fill(288, 676, 116, 52, rgb=(0.18, 0.68, 0.39)),
        pdf_fill(408, 676, 116, 52, rgb=(0.18, 0.68, 0.39)),
        pdf_text(60, 710, "Tickets", size=10),
        pdf_text(60, 690, str(int(SUMMARY["tickets"])), size=17, font="F2"),
        pdf_text(180, 710, "Avg. time", size=10),
        pdf_text(180, 690, hours(float(SUMMARY["avg_resolution"])), size=17, font="F2"),
        pdf_text(300, 710, "SLA rate", size=10),
        pdf_text(300, 690, pct(float(SUMMARY["sla_rate"])), size=17, font="F2"),
        pdf_text(420, 710, "Same day", size=10),
        pdf_text(420, 690, pct(float(SUMMARY["same_day_rate"])), size=17, font="F2"),
        pdf_text(48, 648, "Tickets nach Kategorie", size=13, font="F2"),
        pdf_text(310, 648, "Prioritaeten", size=13, font="F2"),
    ]

    y = 626
    for category, value in category_counts.items():
        lines.append(pdf_text(56, y, category, size=11))
        lines.append(pdf_text(180, y, str(value), size=11, font="F2"))
        y -= 20

    y = 626
    for priority, value in SUMMARY["priority_counts"].items():
        lines.append(pdf_text(318, y, priority, size=11))
        lines.append(pdf_text(418, y, str(value), size=11, font="F2"))
        y -= 20

    lines.extend([
        pdf_text(48, 500, "Ableitung", size=13, font="F2"),
        pdf_text(56, 478, "Die haeufigsten Themen liegen bei Hardware und Accounts.", size=11),
        pdf_text(56, 460, "Das spricht fuer klare Standards bei Geraete-Setups und Benutzerverwaltung.", size=11),
        pdf_text(56, 430, "Nutzen fuer die Bewerbung", size=13, font="F2"),
        pdf_text(56, 408, "Das Projekt zeigt strukturierte Dokumentation, Priorisierung und Service-Denken.", size=11),
        pdf_text(56, 390, "Genau diese Kombination ist fuer Support und Systemadministration relevant.", size=11),
        pdf_text(48, 82, "Service-Dashboard fuer die Bewerbungswebsite. Alle Werte sind als realistische Beispieldaten aufgebaut.", size=10),
    ])
    return "\n".join(lines).encode("ascii")


def service_pdf_insights_stream() -> bytes:
    lines = [
        "q",
        pdf_fill(36, 744, 523, 56, rgb=(0.06, 0.55, 0.30)),
        "Q",
        pdf_text(48, 772, "Service Dashboard - Insights & Arbeitsweise", size=22, font="F2"),
        pdf_text(48, 752, "Die zweite Seite verdichtet die Zahlen auf konkrete Schluesse fuer den Arbeitsalltag.", size=11),
        pdf_text(48, 712, "1. Priorisieren statt verteilen", size=14, font="F2"),
        pdf_text(48, 692, "Nicht jede Anfrage ist gleich wichtig. High-, Medium- und Low-Faelle muessen schnell", size=11),
        pdf_text(48, 676, "eingeordnet werden, damit kritische Stoerungen zuerst bearbeitet werden.", size=11),
        pdf_text(48, 638, "2. Dokumentation hilft dem Team", size=14, font="F2"),
        pdf_text(48, 618, "Eine gute Ticketliste macht Probleme nachvollziehbar und reduziert Rueckfragen.", size=11),
        pdf_text(48, 580, "3. Wiederkehrende Themen erkennen", size=14, font="F2"),
        pdf_text(48, 560, "Wenn Hardware- oder Account-Faelle haeufig auftreten, lassen sich Standards und", size=11),
        pdf_text(48, 544, "Checklisten aufbauen. Genau daraus entsteht operative Verbesserung.", size=11),
        pdf_text(48, 506, "4. Passung fuer Bechtle", size=14, font="F2"),
        pdf_text(48, 486, "Das Projekt ergaenzt mein Praktikum sinnvoll: Ich zeige damit Support-Denken,", size=11),
        pdf_text(48, 470, "Service-Struktur und meine Motivation fuer technische Prozessarbeit.", size=11),
        pdf_text(48, 82, "Seite 2 fokussiert auf strukturierte Arbeitsweise, Priorisierung und klare Service-Logik.", size=10),
    ]
    return "\n".join(lines).encode("ascii")


def resume_pdf_stream() -> bytes:
    lines = [
        "q",
        pdf_fill(36, 756, 523, 50, rgb=(0.06, 0.55, 0.30)),
        pdf_fill(36, 734, 523, 6, rgb=(0.18, 0.68, 0.39)),
        "Q",
        pdf_text(48, 781, "Kassem Jaffal", size=25, font="F2"),
        pdf_text(48, 761, "Bewerbung als Fachinformatiker fuer Systemintegration", size=11),
        pdf_text(48, 718, "Freiburg im Breisgau | 0174 9683772 | Hassan1.jaffal1@outlook.de", size=10),
        pdf_text(48, 702, f"Website und Portfolio: {WEBSITE_URL}", size=10),
        pdf_text(48, 670, "Kurzprofil", size=14, font="F2"),
        pdf_text(48, 652, "Technisch interessierter Bewerber mit Praktikumserfahrung bei Bechtle, Interesse an", size=10),
        pdf_text(48, 638, "Systemadministration, Support, Netzwerken, Hardware und sauberer Dokumentation.", size=10),
        pdf_text(48, 624, "Eigene Projekte in Python, Software-Konzepten und Service-Strukturen ergaenzen", size=10),
        pdf_text(48, 610, "meinen Werdegang um konkrete technische Arbeitsproben.", size=10),
        pdf_text(48, 580, "Schulbildung", size=14, font="F2"),
        pdf_text(48, 562, "07/2025 | Abitur | Wentzinger Gymnasium, Freiburg", size=10),
        pdf_text(48, 532, "Weitere Ausbildung", size=14, font="F2"),
        pdf_text(48, 514, "seit 10/2025 | Universitaet Freiburg | Informatik, Grundlagen aus dem ersten Semester", size=10),
        pdf_text(48, 500, "mit Python, VS Code und technischem Problemverstaendnis.", size=10),
        pdf_text(48, 472, "Praktische Erfahrung", size=14, font="F2"),
        pdf_text(48, 454, "09/2022 | Praktikum bei Bechtle AG | Fachinformatik / Systemintegration", size=10, font="F2"),
        pdf_text(48, 440, "Einblicke in interne Systemadministration, First-Level-Support, Hardware-Einrichtung,", size=10),
        pdf_text(48, 426, "Cisco-Optimierung, virtuelle Maschinen und technische Ablaeufe.", size=10),
        pdf_text(48, 408, "2023 | Soziales Praktikum im Kindergarten St. Elisabeth, Freiburg", size=10, font="F2"),
        pdf_text(48, 394, "Staerkung von Teamfaehigkeit, Kommunikation, Zuverlaessigkeit und Verantwortung.", size=10),
        pdf_text(48, 366, "Projektbeispiele auf der Website", size=14, font="F2"),
        pdf_text(48, 348, "Praktikum Bechtle Freiburg: Support, Hardware, Cisco und virtuelle Maschinen.", size=10),
        pdf_text(48, 334, "Service & Excel Dashboard: Ticketliste, Prioritaeten, SLA und Dokumentation.", size=10),
        pdf_text(48, 320, "Snake in Python: Spiel-Logik, Schleifen, Zustandsverwaltung und Debugging.", size=10),
        pdf_text(48, 306, "Yeet Plattform-Prototyp: Feed-, Profil- und Datenlogik als Software-Konzept.", size=10),
        pdf_text(48, 278, "Kenntnisse", size=14, font="F2"),
        pdf_text(48, 260, "Python-Grundlagen, VS Code, Rechnernetze, Excel-Listen, Service-Dokumentation,", size=10),
        pdf_text(48, 246, "logisches Denken, strukturierte Arbeitsweise, Lernbereitschaft und Teamfaehigkeit.", size=10),
        pdf_text(48, 218, "Sprachen", size=14, font="F2"),
        pdf_text(48, 200, "Deutsch: Muttersprache | Englisch: B2 | Franzoesisch: B2 | Spanisch: B1", size=10),
        pdf_text(48, 82, "Stand: Maerz 2026 | Lebenslauf und Website wurden als zusammengehoeriges IT-Portfolio aufgebaut.", size=9),
    ]
    return "\n".join(lines).encode("ascii")


def write_pdfs() -> None:
    service_pdf = build_pdf([service_pdf_stream(), service_pdf_insights_stream()])
    resume_pdf = build_pdf([resume_pdf_stream()])
    (DOWNLOADS / "Bechtle_IT_Service_Dashboard.pdf").write_bytes(service_pdf)
    (DOWNLOADS / "Kassem_Jaffal_Lebenslauf_Bechtle.pdf").write_bytes(resume_pdf)
    (DOWNLOADS / "Kassem_Jaffal_Lebenslauf.pdf").write_bytes(resume_pdf)


def main() -> None:
    write_csv()
    write_xlsx()
    write_pdfs()


if __name__ == "__main__":
    main()
