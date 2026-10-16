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
