Attribute VB_Name = "EmployeeDedup"
'==============================================================================
' 社員名寄せマクロ (Employee Deduplication Macro)
'==============================================================================
' 機能:
'   1. 同一社員番号の重複行をまとめて表示
'   2. 異なる社員番号だが名前または生年月日が一致する候補を検出
'
' 前提:
'   「社員データ」シートに以下の列が存在すること
'     A列: 社員番号
'     B列: 氏名
'     C列: 生年月日
'   1行目はヘッダー行とする
'==============================================================================

Option Explicit

Private Const SRC_SHEET As String = "社員データ"
Private Const RESULT_DUP_SHEET As String = "重複社員番号"
Private Const RESULT_CANDIDATE_SHEET As String = "名寄せ候補"

'--------------------------------------------------------------
' メインエントリ: 全処理を実行
'--------------------------------------------------------------
Public Sub RunDedup()
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual

    On Error GoTo ErrHandler

    ' 入力シート存在チェック
    If Not SheetExists(SRC_SHEET) Then
        MsgBox "「" & SRC_SHEET & "」シートが見つかりません。" & vbCrLf & _
               "A列:社員番号, B列:氏名, C列:生年月日 のデータを" & vbCrLf & _
               "「" & SRC_SHEET & "」シートに用意してください。", vbExclamation
        GoTo Cleanup
    End If

    Dim wsSrc As Worksheet
    Set wsSrc = ThisWorkbook.Sheets(SRC_SHEET)

    Dim lastRow As Long
    lastRow = wsSrc.Cells(wsSrc.Rows.Count, "A").End(xlUp).Row

    If lastRow < 2 Then
        MsgBox "データがありません。2行目以降にデータを入力してください。", vbExclamation
        GoTo Cleanup
    End If

    ' データ読み込み
    Dim data() As Variant
    data = wsSrc.Range("A1:C" & lastRow).Value

    ' 処理1: 同一社員番号の重複
    Call FindDuplicateIDs(data, lastRow)

    ' 処理2: 名前or生年月日一致で社員番号が異なるケース
    Call FindCandidatesByNameOrBirthday(data, lastRow)

    MsgBox "名寄せ処理が完了しました。" & vbCrLf & vbCrLf & _
           "・「" & RESULT_DUP_SHEET & "」シート: 同一社員番号の重複一覧" & vbCrLf & _
           "・「" & RESULT_CANDIDATE_SHEET & "」シート: 社員番号違いの名寄せ候補", vbInformation

Cleanup:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Exit Sub

ErrHandler:
    MsgBox "エラーが発生しました: " & Err.Description, vbCritical
    Resume Cleanup
End Sub

'--------------------------------------------------------------
' 処理1: 同一社員番号で複数行存在するレコードを抽出
'--------------------------------------------------------------
Private Sub FindDuplicateIDs(ByRef data() As Variant, ByVal lastRow As Long)
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(RESULT_DUP_SHEET)
    ws.Cells.Clear

    ' ヘッダー
    ws.Range("A1").Value = "社員番号"
    ws.Range("B1").Value = "氏名"
    ws.Range("C1").Value = "生年月日"
    ws.Range("D1").Value = "元データ行番号"
    FormatHeader ws, 4

    ' 社員番号ごとに行番号を集める (Dictionary)
    Dim dictID As Object
    Set dictID = CreateObject("Scripting.Dictionary")

    Dim i As Long
    Dim empID As String

    For i = 2 To lastRow
        empID = Trim(CStr(data(i, 1)))
        If empID <> "" Then
            If Not dictID.Exists(empID) Then
                dictID.Add empID, i & ""
            Else
                dictID(empID) = dictID(empID) & "," & i
            End If
        End If
    Next i

    ' 重複(2行以上)のみ出力
    Dim outRow As Long
    outRow = 2

    Dim key As Variant
    Dim rows() As String
    Dim j As Long
    Dim rowNum As Long

    For Each key In dictID.Keys
        rows = Split(dictID(key), ",")
        If UBound(rows) >= 1 Then  ' 2件以上
            For j = 0 To UBound(rows)
                rowNum = CLng(rows(j))
                ws.Cells(outRow, 1).Value = data(rowNum, 1)
                ws.Cells(outRow, 2).Value = data(rowNum, 2)
                ws.Cells(outRow, 3).Value = data(rowNum, 3)
                ws.Cells(outRow, 3).NumberFormat = "yyyy/mm/dd"
                ws.Cells(outRow, 4).Value = rowNum
                outRow = outRow + 1
            Next j
            ' グループ間に空行を入れて見やすくする
            outRow = outRow + 1
        End If
    Next key

    ws.Columns("A:D").AutoFit

    If outRow = 2 Then
        ws.Range("A2").Value = "（重複する社員番号はありませんでした）"
    End If
End Sub

'--------------------------------------------------------------
' 処理2: 社員番号が異なるが名前or生年月日が一致する候補
'--------------------------------------------------------------
Private Sub FindCandidatesByNameOrBirthday(ByRef data() As Variant, ByVal lastRow As Long)
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(RESULT_CANDIDATE_SHEET)
    ws.Cells.Clear

    ' ヘッダー
    ws.Range("A1").Value = "一致種別"
    ws.Range("B1").Value = "社員番号1"
    ws.Range("C1").Value = "氏名1"
    ws.Range("D1").Value = "生年月日1"
    ws.Range("E1").Value = "元データ行1"
    ws.Range("F1").Value = "社員番号2"
    ws.Range("G1").Value = "氏名2"
    ws.Range("H1").Value = "生年月日2"
    ws.Range("I1").Value = "元データ行2"
    FormatHeader ws, 9

    ' 名前辞書・生年月日辞書を構築
    ' キー: 正規化した名前/生年月日 → 値: 行番号リスト
    Dim dictName As Object
    Set dictName = CreateObject("Scripting.Dictionary")

    Dim dictBDay As Object
    Set dictBDay = CreateObject("Scripting.Dictionary")

    Dim i As Long
    Dim nameKey As String
    Dim bdayKey As String

    For i = 2 To lastRow
        ' 名前: スペース除去して正規化
        nameKey = NormalizeName(CStr(data(i, 2)))
        If nameKey <> "" Then
            If Not dictName.Exists(nameKey) Then
                dictName.Add nameKey, i & ""
            Else
                dictName(nameKey) = dictName(nameKey) & "," & i
            End If
        End If

        ' 生年月日
        bdayKey = NormalizeBirthday(data(i, 3))
        If bdayKey <> "" Then
            If Not dictBDay.Exists(bdayKey) Then
                dictBDay.Add bdayKey, i & ""
            Else
                dictBDay(bdayKey) = dictBDay(bdayKey) & "," & i
            End If
        End If
    Next i

    ' ペア重複排除用
    Dim pairDict As Object
    Set pairDict = CreateObject("Scripting.Dictionary")

    Dim outRow As Long
    outRow = 2

    ' 名前一致で社員番号が異なるペアを出力
    outRow = OutputCandidates(ws, data, dictName, "氏名一致", outRow, pairDict)

    ' 生年月日一致で社員番号が異なるペアを出力
    outRow = OutputCandidates(ws, data, dictBDay, "生年月日一致", outRow, pairDict)

    ws.Columns("A:I").AutoFit

    If outRow = 2 Then
        ws.Range("A2").Value = "（名寄せ候補はありませんでした）"
    End If
End Sub

'--------------------------------------------------------------
' 候補ペアを出力 (社員番号が異なる組み合わせのみ)
'--------------------------------------------------------------
Private Function OutputCandidates(ByRef ws As Worksheet, _
                                   ByRef data() As Variant, _
                                   ByRef dict As Object, _
                                   ByVal matchType As String, _
                                   ByVal startRow As Long, _
                                   ByRef pairDict As Object) As Long
    Dim key As Variant
    Dim rows() As String
    Dim j As Long, k As Long
    Dim r1 As Long, r2 As Long
    Dim id1 As String, id2 As String
    Dim pairKey As String
    Dim outRow As Long
    outRow = startRow

    For Each key In dict.Keys
        rows = Split(dict(key), ",")
        If UBound(rows) >= 1 Then
            ' 全ペアの組み合わせ
            For j = 0 To UBound(rows) - 1
                For k = j + 1 To UBound(rows)
                    r1 = CLng(rows(j))
                    r2 = CLng(rows(k))

                    id1 = Trim(CStr(data(r1, 1)))
                    id2 = Trim(CStr(data(r2, 1)))

                    ' 社員番号が異なる場合のみ出力
                    If id1 <> id2 Then
                        ' ペアの重複排除 (小さい方を先に)
                        If id1 < id2 Then
                            pairKey = id1 & "|" & id2 & "|" & matchType
                        Else
                            pairKey = id2 & "|" & id1 & "|" & matchType
                        End If

                        If Not pairDict.Exists(pairKey) Then
                            pairDict.Add pairKey, True

                            ws.Cells(outRow, 1).Value = matchType
                            ws.Cells(outRow, 2).Value = data(r1, 1)
                            ws.Cells(outRow, 3).Value = data(r1, 2)
                            ws.Cells(outRow, 4).Value = data(r1, 3)
                            ws.Cells(outRow, 4).NumberFormat = "yyyy/mm/dd"
                            ws.Cells(outRow, 5).Value = r1
                            ws.Cells(outRow, 6).Value = data(r2, 1)
                            ws.Cells(outRow, 7).Value = data(r2, 2)
                            ws.Cells(outRow, 8).Value = data(r2, 3)
                            ws.Cells(outRow, 8).NumberFormat = "yyyy/mm/dd"
                            ws.Cells(outRow, 9).Value = r2
                            outRow = outRow + 1
                        End If
                    End If
                Next k
            Next j
        End If
    Next key

    OutputCandidates = outRow
End Function

'--------------------------------------------------------------
' 名前の正規化: 全角/半角スペース除去、大文字化
'--------------------------------------------------------------
Private Function NormalizeName(ByVal name As String) As String
    Dim s As String
    s = Trim(name)
    s = Replace(s, " ", "")    ' 半角スペース
    s = Replace(s, "　", "")   ' 全角スペース
    s = UCase(s)
    NormalizeName = s
End Function

'--------------------------------------------------------------
' 生年月日の正規化: 日付をYYYYMMDD文字列に統一
'--------------------------------------------------------------
Private Function NormalizeBirthday(ByVal val As Variant) As String
    On Error GoTo InvalidDate

    If IsEmpty(val) Or val = "" Then
        NormalizeBirthday = ""
        Exit Function
    End If

    Dim d As Date
    If IsDate(val) Then
        d = CDate(val)
        NormalizeBirthday = Format(d, "yyyymmdd")
    Else
        ' 文字列の場合もパース試行
        d = CDate(CStr(val))
        NormalizeBirthday = Format(d, "yyyymmdd")
    End If
    Exit Function

InvalidDate:
    NormalizeBirthday = ""
End Function

'--------------------------------------------------------------
' シート存在チェック
'--------------------------------------------------------------
Private Function SheetExists(ByVal sheetName As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(sheetName)
    On Error GoTo 0
    SheetExists = Not ws Is Nothing
End Function

'--------------------------------------------------------------
' シートを取得 or 新規作成
'--------------------------------------------------------------
Private Function GetOrCreateSheet(ByVal sheetName As String) As Worksheet
    If SheetExists(sheetName) Then
        Set GetOrCreateSheet = ThisWorkbook.Sheets(sheetName)
    Else
        Set GetOrCreateSheet = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
        GetOrCreateSheet.name = sheetName
    End If
End Function

'--------------------------------------------------------------
' ヘッダー行の書式設定
'--------------------------------------------------------------
Private Sub FormatHeader(ByRef ws As Worksheet, ByVal colCount As Long)
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, colCount))
        .Font.Bold = True
        .Interior.Color = RGB(68, 114, 196)
        .Font.Color = RGB(255, 255, 255)
        .Borders(xlEdgeBottom).LineStyle = xlContinuous
    End With
End Sub

'--------------------------------------------------------------
' サンプルデータ生成 (テスト用)
'--------------------------------------------------------------
Public Sub CreateSampleData()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(SRC_SHEET)
    ws.Cells.Clear

    ' ヘッダー
    ws.Range("A1").Value = "社員番号"
    ws.Range("B1").Value = "氏名"
    ws.Range("C1").Value = "生年月日"
    FormatHeader ws, 3

    ' サンプルデータ
    Dim d As Variant
    d = Array( _
        Array("EMP001", "田中 太郎", "1985/04/15"), _
        Array("EMP002", "鈴木 花子", "1990/08/22"), _
        Array("EMP001", "田中 太郎", "1985/04/15"), _
        Array("EMP003", "佐藤 一郎", "1988/12/01"), _
        Array("EMP004", "田中太郎", "1985/04/15"), _
        Array("EMP005", "山田 次郎", "1992/03/10"), _
        Array("EMP006", "高橋 美咲", "1990/08/22"), _
        Array("EMP002", "鈴木 花子", "1990/08/22"), _
        Array("EMP007", "伊藤 健一", "1995/06/30"), _
        Array("EMP008", "佐藤一郎", "1975/11/11"), _
        Array("EMP009", "渡辺 真理", "1988/12/01"), _
        Array("EMP010", "鈴木 花子", "1993/05/05") _
    )

    Dim i As Long
    For i = 0 To UBound(d)
        ws.Cells(i + 2, 1).Value = d(i)(0)
        ws.Cells(i + 2, 2).Value = d(i)(1)
        ws.Cells(i + 2, 3).Value = CDate(d(i)(2))
        ws.Cells(i + 2, 3).NumberFormat = "yyyy/mm/dd"
    Next i

    ws.Columns("A:C").AutoFit

    MsgBox "サンプルデータを「" & SRC_SHEET & "」シートに作成しました。" & vbCrLf & _
           "「RunDedup」マクロを実行して名寄せを試してください。", vbInformation
End Sub
