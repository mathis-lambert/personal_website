import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";

export const EditorialTable = Table.configure({
  resizable: true,
  lastColumnResizable: false,
});

export const EditorialTableCell = TableCell.extend({
  content: "paragraph",
});

export const EditorialTableHeader = TableHeader.extend({
  content: "paragraph",
});

export const EditorialTableRow = TableRow;
