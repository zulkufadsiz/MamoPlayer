if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/zulkufadsiz/.gradle/caches/9.0.0/transforms/b67669d7b814d4b881402bc5a1fb212b/transformed/hermes-android-0.81.6-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/zulkufadsiz/.gradle/caches/9.0.0/transforms/b67669d7b814d4b881402bc5a1fb212b/transformed/hermes-android-0.81.6-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

