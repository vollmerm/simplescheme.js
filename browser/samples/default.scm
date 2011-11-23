; select from the drop-down menu below to load a sample file

; factorial
(define (fact n)
  (if (<= n 1) 1
  (* n (fact (- n 1)))))

(fact 10)
