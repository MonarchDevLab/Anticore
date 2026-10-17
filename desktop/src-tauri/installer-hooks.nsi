; Anticore NSIS Kurulum Kancasi
; Kurulum baslamadan once calisan eski Anticore ve anticore-cli sureclerini sonlandirir.
; Dosya kilitleme ve paylasim hatalarini (ERROR_SHARING_VIOLATION) onler.

!macro customInit
  nsExec::Exec 'taskkill /F /IM Anticore.exe'
  nsExec::Exec 'taskkill /F /IM anticore-desktop.exe'
  nsExec::Exec 'taskkill /F /IM anticore-cli.exe'
  nsExec::Exec 'net stop AnticoreService'
  nsExec::Exec 'net stop WinDivert'
  nsExec::Exec 'net stop WinDivert14'
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ${If} ${FileExists} "$DESKTOP\${PRODUCTNAME}.lnk"
    CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
    !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
  ${EndIf}
  ${If} ${FileExists} "$SMPROGRAMS\${PRODUCTNAME}.lnk"
    CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
    !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"
  ${EndIf}
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
  nsExec::Exec 'ie4uinit.exe -show'
!macroend

