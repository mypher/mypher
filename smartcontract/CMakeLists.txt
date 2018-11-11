cmake_minimum_required(VERSION 3.5)
project(mypher VERSION 0.0.1)

if(EOSIO_CDT_ROOT STREQUAL "" OR NOT EOSIO_CDT_ROOT)
    set(EOSIO_CDT_ROOT "/usr/local/eosio.cdt")
endif()
list(APPEND CMAKE_MODULE_PATH ${EOSIO_CDT_ROOT}/lib/cmake)
include(EosioWasmToolchain)

configure_file(${CMAKE_SOURCE_DIR}/mypher.abi mypher.abi COPYONLY)
set(CMAKE_MODULE_PATH "${EOSIO_CDT_ROOT}/lib")
add_executable( mypher.wasm mypher.cpp person.cpp cipher.cpp token.cpp validator/vcipher.cpp validator/vcommon.cpp common/prim.cpp)

#add_custom_command(
#	OUTPUT
#		mypher.abi
#	DEPEND
#		${CMAKE_SOURCE_DIR}/mypher.cpp
#	COMMAND
#		eosio-abigen ${CMAKE_SOURCE_DIR}/mypher.hpp -output mypher.abi
#)

file(MAKE_DIRECTORY ../docker/contracts/mypher)
add_custom_target(cpwasm ALL COMMAND "cp" "-f" "*.wasm" "../../docker/contracts/mypher")
add_custom_target(cpabi ALL COMMAND "cp" "-f" "*.abi" "../../docker/contracts/mypher")
