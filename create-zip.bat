echo off
set zipName=atto_recittakepicture
set pluginName=recittakepicture

rem remove the current 
del %zipName%

rem zip the folder except the folders .cache and node_modules
"c:\Program Files\7-Zip\7z.exe" a -mx "%zipName%.zip" "src\*" -mx0 

rem set the plugin name
"c:\Program Files\7-Zip\7z.exe" rn "%zipName%.zip" "src\" "%pluginName%\"

pause