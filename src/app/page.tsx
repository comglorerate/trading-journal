"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryItem {
  id: string;
  percentage: number;
  timestamp: Date;
}

interface DailyData {
  date: string;
  takeProfitHistory: HistoryItem[];
  stopLossHistory: HistoryItem[];
}

interface EditState {
  id: string | null;
  type: "takeProfit" | "stopLoss" | null;
  value: string;
}

export default function TradingInterface() {
  const [date, setDate] = useState<Date>(new Date("2025-08-06"));
  const [takeProfitInput, setTakeProfitInput] = useState("");
  const [stopLossInput, setStopLossInput] = useState("");
  const [allDailyData, setAllDailyData] = useState<{
    [key: string]: DailyData;
  }>({});
  const [editState, setEditState] = useState<EditState>({
    id: null,
    type: null,
    value: "",
  });

  // Helper function to get date string key
  const getDateKey = (selectedDate: Date) => {
    return format(selectedDate, "yyyy-MM-dd");
  };

  // Get current day's data
  const getCurrentDayData = (): DailyData => {
    const dateKey = getDateKey(date);
    return (
      allDailyData[dateKey] || {
        date: dateKey,
        takeProfitHistory: [],
        stopLossHistory: [],
      }
    );
  };

  // Update data for current day
  const updateCurrentDayData = (updates: Partial<DailyData>) => {
    const dateKey = getDateKey(date);
    setAllDailyData((prev) => ({
      ...prev,
      [dateKey]: {
        ...getCurrentDayData(),
        ...updates,
      },
    }));
  };

  // Get current day's history arrays
  const takeProfitHistory = getCurrentDayData().takeProfitHistory;
  const stopLossHistory = getCurrentDayData().stopLossHistory;

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("tradingData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Convert old format to new format if needed
        if (parsed.takeProfitHistory && parsed.stopLossHistory) {
          // Old format - convert to new format
          const dateKey = format(new Date(parsed.date), "yyyy-MM-dd");
          setAllDailyData({
            [dateKey]: {
              date: dateKey,
              takeProfitHistory: parsed.takeProfitHistory.map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp),
              })),
              stopLossHistory: parsed.stopLossHistory.map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp),
              })),
            },
          });
          setDate(new Date(parsed.date));
        } else {
          // New format
          const convertedData: { [key: string]: DailyData } = {};
          Object.entries(parsed.allDailyData || {}).forEach(
            ([dateKey, dayData]: [string, any]) => {
              convertedData[dateKey] = {
                ...dayData,
                takeProfitHistory: dayData.takeProfitHistory.map(
                  (item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp),
                  })
                ),
                stopLossHistory: dayData.stopLossHistory.map((item: any) => ({
                  ...item,
                  timestamp: new Date(item.timestamp),
                })),
              };
            }
          );
          setAllDailyData(convertedData);
          setDate(new Date(parsed.currentDate));
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      currentDate: date.toISOString(),
      allDailyData,
    };
    localStorage.setItem("tradingData", JSON.stringify(dataToSave));
  }, [date, allDailyData]);

  const takeProfitTotal = takeProfitHistory.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  const stopLossTotal = stopLossHistory.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  const profitTotal = takeProfitTotal - stopLossTotal;

  const addTakeProfit = () => {
    const percentage = parseFloat(takeProfitInput);
    if (!isNaN(percentage) && percentage > 0) {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        percentage,
        timestamp: new Date(),
      };
      const currentData = getCurrentDayData();
      updateCurrentDayData({
        takeProfitHistory: [...currentData.takeProfitHistory, newItem],
      });
      setTakeProfitInput("");
    }
  };

  const addStopLoss = () => {
    const percentage = parseFloat(stopLossInput);
    if (!isNaN(percentage) && percentage > 0) {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        percentage,
        timestamp: new Date(),
      };
      const currentData = getCurrentDayData();
      updateCurrentDayData({
        stopLossHistory: [...currentData.stopLossHistory, newItem],
      });
      setStopLossInput("");
    }
  };

  const removeHistoryItem = (type: "takeProfit" | "stopLoss", id: string) => {
    const currentData = getCurrentDayData();
    if (type === "takeProfit") {
      updateCurrentDayData({
        takeProfitHistory: currentData.takeProfitHistory.filter(
          (item) => item.id !== id
        ),
      });
    } else {
      updateCurrentDayData({
        stopLossHistory: currentData.stopLossHistory.filter(
          (item) => item.id !== id
        ),
      });
    }
  };

  const clearHistory = (type: "takeProfit" | "stopLoss") => {
    if (type === "takeProfit") {
      updateCurrentDayData({
        takeProfitHistory: [],
      });
    } else {
      updateCurrentDayData({
        stopLossHistory: [],
      });
    }
  };

  const startEdit = (
    type: "takeProfit" | "stopLoss",
    id: string,
    currentValue: number
  ) => {
    setEditState({
      id,
      type,
      value: currentValue.toString(),
    });
  };

  const saveEdit = () => {
    if (editState.id && editState.type) {
      const newValue = parseFloat(editState.value);
      if (!isNaN(newValue) && newValue > 0) {
        const currentData = getCurrentDayData();
        if (editState.type === "takeProfit") {
          updateCurrentDayData({
            takeProfitHistory: currentData.takeProfitHistory.map((item) =>
              item.id === editState.id
                ? { ...item, percentage: newValue }
                : item
            ),
          });
        } else {
          updateCurrentDayData({
            stopLossHistory: currentData.stopLossHistory.map((item) =>
              item.id === editState.id
                ? { ...item, percentage: newValue }
                : item
            ),
          });
        }
      }
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditState({ id: null, type: null, value: "" });
  };

  const clearAllData = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer."
      )
    ) {
      localStorage.removeItem("tradingData");
      setAllDailyData({});
      setDate(new Date("2025-08-06"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Jornada de Trading
          </h1>

          {/* Date Picker */}
          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date
                    ? format(date, "dd/MM/yyyy", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Profit Total */}
          <Card className="w-fit mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {profitTotal >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <span className="text-lg font-semibold">Profit Total:</span>
                <span
                  className={`text-xl font-bold ${
                    profitTotal >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {profitTotal.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Take Profit Section */}
          <Card className="h-fit">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                <TrendingUp className="h-5 w-5" />
                <span>Take Profit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Ingresar un porcentaje (%)"
                  value={takeProfitInput}
                  onChange={(e) => setTakeProfitInput(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
                <Button
                  onClick={addTakeProfit}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!takeProfitInput}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {takeProfitTotal.toFixed(2)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-slate-700 dark:text-slate-300">
                    Historial:
                  </h3>
                  {takeProfitHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearHistory("takeProfit")}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {takeProfitHistory.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
                      No hay registros
                    </p>
                  ) : (
                    takeProfitHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm"
                      >
                        {editState.id === item.id &&
                        editState.type === "takeProfit" ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <Input
                              type="number"
                              value={editState.value}
                              onChange={(e) =>
                                setEditState((prev) => ({
                                  ...prev,
                                  value: e.target.value,
                                }))
                              }
                              className="w-20 h-8 text-sm"
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="h-6 w-6 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              +{item.percentage.toFixed(2)}%
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              {format(item.timestamp, "HH:mm")}
                            </span>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  startEdit(
                                    "takeProfit",
                                    item.id,
                                    item.percentage
                                  )
                                }
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeHistoryItem("takeProfit", item.id)
                                }
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stop Loss Section */}
          <Card className="h-fit">
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                <TrendingDown className="h-5 w-5" />
                <span>Stop Loss</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Ingresar un porcentaje (%)"
                  value={stopLossInput}
                  onChange={(e) => setStopLossInput(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
                <Button
                  onClick={addStopLoss}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!stopLossInput}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {stopLossTotal.toFixed(2)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-slate-700 dark:text-slate-300">
                    Historial:
                  </h3>
                  {stopLossHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearHistory("stopLoss")}
                      className="text-xs"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {stopLossHistory.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
                      No hay registros
                    </p>
                  ) : (
                    stopLossHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm"
                      >
                        {editState.id === item.id &&
                        editState.type === "stopLoss" ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <Input
                              type="number"
                              value={editState.value}
                              onChange={(e) =>
                                setEditState((prev) => ({
                                  ...prev,
                                  value: e.target.value,
                                }))
                              }
                              className="w-20 h-8 text-sm"
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="h-6 w-6 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              -{item.percentage.toFixed(2)}%
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">
                              {format(item.timestamp, "HH:mm")}
                            </span>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  startEdit(
                                    "stopLoss",
                                    item.id,
                                    item.percentage
                                  )
                                }
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeHistoryItem("stopLoss", item.id)
                                }
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Resumen de Operación
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Take Profit
                  </p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    +{takeProfitTotal.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Stop Loss
                  </p>
                  <p className="font-bold text-red-600 dark:text-red-400">
                    -{stopLossTotal.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Neto</p>
                  <p
                    className={`font-bold ${
                      profitTotal >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {profitTotal >= 0 ? "+" : ""}
                    {profitTotal.toFixed(2)}%
                  </p>
                </div>
              </div>
              {(takeProfitHistory.length > 0 || stopLossHistory.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllData}
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  Limpiar todos los datos
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
