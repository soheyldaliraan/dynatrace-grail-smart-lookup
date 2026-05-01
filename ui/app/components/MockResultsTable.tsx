import React, { useMemo } from "react";

import {
  DataTable,
  type DataTableColumnDef,
} from "@dynatrace/strato-components-preview/tables";

import { MOCK_BASE_ROWS } from "../data/mockResults";
import { buildResults, type ResultRow } from "../utils/buildResults";

type Props = {
  query: string;
};

export const MockResultsTable: React.FC<Props> = ({ query }) => {
  const { rows, columns } = useMemo(
    () => buildResults(query, MOCK_BASE_ROWS),
    [query],
  );

  const columnDefs = useMemo<DataTableColumnDef<ResultRow>[]>(
    () =>
      columns.map((c) => ({
        id: c,
        header: c,
        accessor: c,
      })),
    [columns],
  );

  return (
    <DataTable
      data={rows}
      columns={columnDefs}
      variant={{ rowDensity: "condensed", fontStyle: "code" }}
      fullWidth
    />
  );
};
