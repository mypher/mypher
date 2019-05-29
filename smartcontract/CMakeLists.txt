cmake_minimum_required(VERSION 3.5)
project(mypher VERSION 0.0.1)

#if(EOSIO_CDT_ROOT STREQUAL "" OR NOT EOSIO_CDT_ROOT)
	find_package(eosio.cdt)
#    set(EOSIO_CDT_ROOT "/usr/local/eosio.cdt")
#endif()
#list(APPEND CMAKE_MODULE_PATH ${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt)
#include(EosioWasmToolchain)

#configure_file(${CMAKE_SOURCE_DIR}/myphersystem.abi myphersystem.abi COPYONLY)
#set(CMAKE_MODULE_PATH "${EOSIO_CDT_ROOT}/lib")
add_contract( myphersystem myphersystem mypher.cpp person.cpp cipher.cpp token.cpp task.cpp multisig.cpp common/prim.cpp common/validator.cpp)

add_custom_command(
	OUTPUT myphersystem.abi
	DEPENDS myphersystem.wasm
	COMMAND "node" "${CMAKE_SOURCE_DIR}/tools/make_abi.js" "${CMAKE_SOURCE_DIR}" "${CMAKE_SOURCE_DIR}/build/myphersystem.abi"
)


file(MAKE_DIRECTORY ../docker/contracts/myphersystem)
add_custom_target(cpwasm ALL DEPENDS myphersystem.wasm COMMAND "cp" "-f" "*.wasm" "../../docker/contracts/myphersystem")
add_custom_target(cpabi ALL DEPENDS myphersystem.abi COMMAND "cp" "-f" "*.abi" "../../docker/contracts/myphersystem")
